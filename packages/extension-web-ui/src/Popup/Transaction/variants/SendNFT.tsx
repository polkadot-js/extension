// Copyright 2019-2022 @polkadot/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType, NftCollection, NftItem } from '@subwallet/extension-base/background/KoniTypes';
import { SWTransactionResponse } from '@subwallet/extension-base/services/transaction-service/types';
import { isSameAddress } from '@subwallet/extension-base/utils';
import { AddressInput, ChainSelector, HiddenInput, PageWrapper } from '@subwallet/extension-web-ui/components';
import { DEFAULT_MODEL_VIEWER_PROPS, SHOW_3D_MODELS_CHAIN } from '@subwallet/extension-web-ui/constants';
import { DataContext } from '@subwallet/extension-web-ui/contexts/DataContext';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { useFocusFormItem, useGetChainPrefixBySlug, useHandleSubmitTransaction, useInitValidateTransaction, usePreCheckAction, useRestoreTransaction, useSelector, useSetCurrentPage, useTransactionContext, useWatchTransaction } from '@subwallet/extension-web-ui/hooks';
import { evmNftSubmitTransaction, substrateNftSubmitTransaction } from '@subwallet/extension-web-ui/messaging';
import { FormCallbacks, FormFieldData, FormInstance, FormRule, SendNftParams, ThemeProps } from '@subwallet/extension-web-ui/types';
import { findAccountByAddress, noop, reformatAddress, simpleCheckForm } from '@subwallet/extension-web-ui/utils';
import { Button, Form, Icon, Image, Typography } from '@subwallet/react-ui';
import CN from 'classnames';
import { ArrowCircleRight } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { isAddress, isEthereumAddress } from '@polkadot/util-crypto';

import { nftParamsHandler } from '../helper';
import { FreeBalance, TransactionContent, TransactionFooter } from '../parts';

type Props = ThemeProps & {
  nftDetail?: NftItem
  modalContent?: boolean
};

const DEFAULT_COLLECTION: NftCollection = {
  collectionId: 'unknown',
  chain: 'unknown'
};

const DEFAULT_ITEM: NftItem = {
  collectionId: 'unknown',
  chain: 'unknown',
  owner: 'unknown',
  id: 'unknown'
};

const hiddenFields: Array<keyof SendNftParams> = ['from', 'chain', 'asset', 'itemId', 'collectionId'];
const validateFields: Array<keyof SendNftParams> = ['to'];

const Component: React.FC<{ nftDetail?: NftItem, modalContent?: boolean }> = ({ modalContent = false, nftDetail }) => {
  useSetCurrentPage('/transaction/send-nft');
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isWebUI } = useContext(ScreenContext);

  const { defaultData, persistData } = useTransactionContext<SendNftParams>();

  const { collectionId, itemId } = defaultData;

  const [form] = Form.useForm<SendNftParams>();
  const formDefault = useMemo(() => {
    return {
      ...defaultData
    };
  }, [defaultData]);

  const from = useWatchTransaction('from', form, defaultData);
  const chain = useWatchTransaction('chain', form, defaultData);

  const { chainInfoMap } = useSelector((state) => state.chainStore);
  const { nftCollections, nftItems } = useSelector((state) => state.nft);
  const { accounts } = useSelector((state) => state.accountState);
  const [isBalanceReady, setIsBalanceReady] = useState(true);

  const nftItem = useMemo((): NftItem =>
    nftItems.find(
      (item) =>
        isSameAddress(item.owner, from) &&
        chain === item.chain &&
        item.collectionId === collectionId &&
        item.id === itemId
    ) || DEFAULT_ITEM
  , [collectionId, itemId, chain, nftItems, from]);

  const collectionInfo = useMemo((): NftCollection =>
    nftCollections.find(
      (item) =>
        chain === item.chain &&
      item.collectionId === collectionId
    ) || DEFAULT_COLLECTION
  , [collectionId, chain, nftCollections]);

  const chainInfo = useMemo(() => chainInfoMap[chain], [chainInfoMap, chain]);
  const addressPrefix = useGetChainPrefixBySlug(chain);
  const chainGenesisHash = chainInfoMap[chain]?.substrateInfo?.genesisHash || '';

  const { onError, onSuccess } = useHandleSubmitTransaction();

  const [isDisable, setIsDisable] = useState(true);
  const [loading, setLoading] = useState(false);

  const recipientValidator = useCallback(({ getFieldValue }: FormInstance<SendNftParams>) => {
    return ({
      validator: (rule: FormRule, _recipientAddress: string): Promise<void> => {
        if (!_recipientAddress) {
          return Promise.reject(t('The recipient address is required'));
        }

        if (!isAddress(_recipientAddress)) {
          return Promise.reject(t('Invalid recipient address'));
        }

        if (!isEthereumAddress(_recipientAddress)) {
          const chainInfo = chainInfoMap[chain];
          const addressPrefix = chainInfo?.substrateInfo?.addressPrefix ?? 42;
          const _addressOnChain = reformatAddress(_recipientAddress, addressPrefix);

          if (_addressOnChain !== _recipientAddress) {
            return Promise.reject(t('Recipient should be a valid {{networkName}} address', { replace: { networkName: chainInfo.name } }));
          }
        }

        if (isSameAddress(_recipientAddress, from)) {
          return Promise.reject(t('The recipient address can not be the same as the sender address'));
        }

        if (isEthereumAddress(_recipientAddress) !== isEthereumAddress(from)) {
          const message = isEthereumAddress(from) ? t('Receive address must be of EVM account.') : t('Receive address must be of Substrate account.');

          return Promise.reject(message);
        }

        const account = findAccountByAddress(accounts, _recipientAddress);

        if (account && account.isHardware) {
          const chainInfo = chainInfoMap[chain];
          const availableGen: string[] = account.availableGenesisHashes || [];

          if (!account.isGeneric && !availableGen.includes(chainInfo?.substrateInfo?.genesisHash || '')) {
            const chainName = chainInfo?.name || 'Unknown';

            return Promise.reject(t('Wrong network. Your Ledger account is not supported by {{network}}. Please choose another receiving account and try again.', { replace: { network: chainName } }));
          }
        }

        return Promise.resolve();
      }
    });
  }, [from, accounts, t, chainInfoMap, chain]);

  const onFieldsChange: FormCallbacks<SendNftParams>['onFieldsChange'] = useCallback((changedFields: FormFieldData[], allFields: FormFieldData[]) => {
    const { error } = simpleCheckForm(allFields);

    persistData(form.getFieldsValue());
    setIsDisable(error);
  }, [form, persistData]);

  // Submit transaction
  const onSubmit: FormCallbacks<SendNftParams>['onFinish'] = useCallback(
    (values: SendNftParams) => {
      const { chain, from: _from, to } = values;
      const isEthereumInterface = isEthereumAddress(_from);
      const from = reformatAddress(_from, addressPrefix);
      const params = nftParamsHandler(nftItem, chain);
      let sendPromise: Promise<SWTransactionResponse>;

      if (isEthereumInterface) {
        // Send NFT with EVM interface
        sendPromise = evmNftSubmitTransaction({
          senderAddress: from,
          networkKey: chain,
          recipientAddress: to,
          nftItemName: nftItem?.name,
          params,
          nftItem
        });
      } else {
        // Send NFT with substrate interface
        sendPromise = substrateNftSubmitTransaction({
          networkKey: chain,
          recipientAddress: to,
          senderAddress: from,
          nftItemName: nftItem?.name,
          params,
          nftItem
        });
      }

      setLoading(true);

      setTimeout(() => {
        // Handle transfer action
        sendPromise
          .then(onSuccess)
          .catch(onError)
          .finally(() => {
            setLoading(false);
          });
      }, 300);
    },
    [addressPrefix, nftItem, onError, onSuccess]
  );

  const checkAction = usePreCheckAction(from);

  useEffect(() => {
    if (nftItem === DEFAULT_ITEM || collectionInfo === DEFAULT_COLLECTION) {
      navigate('/home/nfts/collections');
    }
  }, [collectionInfo, navigate, nftItem]);

  // enable button at first time
  useEffect(() => {
    if (defaultData.to) {
      // First time the form is empty, so need time out
      setTimeout(() => {
        form.validateFields().finally(noop);
      }, 500);
    }
  }, [form, defaultData]);

  // Focus to the first field
  useFocusFormItem(form, 'to');
  useRestoreTransaction(form);
  useInitValidateTransaction(validateFields, form, defaultData);

  const show3DModel = SHOW_3D_MODELS_CHAIN.includes(nftItem.chain);

  return (
    <>
      <TransactionContent className={CN('-transaction-content', {
        '__web-content': modalContent
      })}
      >
        <div className={CN('nft_item_detail text-center', {
          '__modal-ui': modalContent
        })}
        >
          <Image
            height={modalContent ? 180 : 120}
            modelViewerProps={show3DModel ? DEFAULT_MODEL_VIEWER_PROPS : undefined}
            src={nftItem.image}
            width={modalContent ? 180 : 120}
          />
          <Typography.Title level={5}>
            {nftItem.name}
          </Typography.Title>
        </div>

        <Form
          className={CN('form-container form-space-sm', {
            '__modal-ui': modalContent
          })}
          form={form}
          initialValues={formDefault}
          onFieldsChange={onFieldsChange}
          onFinish={onSubmit}
        >
          <HiddenInput fields={hiddenFields} />
          <Form.Item
            name={'to'}
            rules={[
              recipientValidator
            ]}
            statusHelpAsTooltip={isWebUI}
          >
            <AddressInput
              addressPrefix={addressPrefix}
              allowDomain={true}
              chain={chain}
              fitNetwork={true}
              label={t('Send to')}
              networkGenesisHash={chainGenesisHash}
              placeholder={t('Account address')}
              saveAddress={true}
              showAddressBook={true}
              showScanner={true}
            />
          </Form.Item>

          <Form.Item>
            <ChainSelector
              disabled={true}
              items={chainInfo ? [{ name: chainInfo.name, slug: chainInfo.slug }] : []}
              label={t('Network')}
              value={collectionInfo.chain}
            />
          </Form.Item>
        </Form>

        <FreeBalance
          address={from}
          chain={chain}
          label={t('Sender transferable balance') + ':'}
          onBalanceReady={setIsBalanceReady}
        />
      </TransactionContent>
      <TransactionFooter
        className={CN('send-nft-transaction-footer', {
          '__modal-ui': modalContent
        })}
      >
        <Button
          disabled={isDisable || !isBalanceReady}
          icon={(
            <Icon
              phosphorIcon={ArrowCircleRight}
              weight={'fill'}
            />
          )}
          loading={loading}
          onClick={checkAction(form.submit, ExtrinsicType.SEND_NFT)}
        >
          {t('Next')}
        </Button>
      </TransactionFooter>
    </>
  );
};

const Wrapper: React.FC<Props> = (props: Props) => {
  const { className } = props;

  const dataContext = useContext(DataContext);

  return (
    <PageWrapper
      className={className}
      resolve={dataContext.awaitStores(['nft'])}
    >
      <Component
        modalContent={props.modalContent}
        nftDetail={props.nftDetail}
      />
    </PageWrapper>
  );
};

const SendNFT = styled(Wrapper)<Props>(({ theme: { token } }: Props) => {
  return {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',

    '.nft_item_detail h5': {
      marginTop: token.marginXS,
      marginBottom: token.margin
    },

    '.__modal-ui': {
      '&.form-container': {
        display: 'flex',
        flexDirection: 'column-reverse'
      },

      '&.send-nft-transaction-footer': {
        '& > .ant-btn': {
          width: '100%'
        }
      },

      '&.nft_item_detail': {
        img: {
          aspectRatio: '1'
        }
      }
    },

    '.nft_item_detail': {
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',

      '.ant-image-img': {
        maxWidth: '100%',
        objectFit: 'cover'
      }
    }
  };
});

export default SendNFT;
