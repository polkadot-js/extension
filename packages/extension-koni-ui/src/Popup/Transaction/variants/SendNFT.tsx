// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NftCollection, NftItem } from '@subwallet/extension-base/background/KoniTypes';
import { SWTransactionResponse } from '@subwallet/extension-base/services/transaction-service/types';
import { isSameAddress } from '@subwallet/extension-base/utils';
import { AddressInput, ChainSelector, PageWrapper } from '@subwallet/extension-koni-ui/components';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { useFocusFormItem, useGetChainPrefixBySlug, useHandleSubmitTransaction, usePreCheckReadOnly, useSelector } from '@subwallet/extension-koni-ui/hooks';
import { evmNftSubmitTransaction, substrateNftSubmitTransaction } from '@subwallet/extension-koni-ui/messaging';
import { FormCallbacks, FormFieldData, FormInstance, FormRule, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { simpleCheckForm } from '@subwallet/extension-koni-ui/utils';
import { Button, Form, Icon, Image, Typography } from '@subwallet/react-ui';
import CN from 'classnames';
import { ArrowCircleRight } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { isAddress, isEthereumAddress } from '@polkadot/util-crypto';

import { nftParamsHandler } from '../helper';
import { FreeBalance, TransactionContent, TransactionFooter } from '../parts';
import { TransactionContext, TransactionFormBaseProps } from '../Transaction';

type Props = ThemeProps & {
  nftDetail?: NftItem
  modalContent?: boolean
};

enum FormFieldName {
  TO = 'to'
}

interface SendNFTFormProps extends TransactionFormBaseProps {
  [FormFieldName.TO]: string
}

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

const Component: React.FC<{ nftDetail?: NftItem, modalContent?: boolean }> = ({ modalContent = false,
  nftDetail = DEFAULT_ITEM }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { chain: nftChain = '', collectionId, itemId, owner = '' } = useParams();

  const { chainInfoMap } = useSelector((state) => state.chainStore);
  const { nftCollections, nftItems } = useSelector((state) => state.nft);
  const [isBalanceReady, setIsBalanceReady] = useState(true);

  const currentNftDetails = useMemo(() => modalContent
    ? {
      nftChain: nftDetail.chain,
      collectionId: nftDetail.collectionId,
      itemId: nftDetail.id,
      owner: nftDetail.owner
    }
    : {
      nftChain,
      collectionId,
      itemId,
      owner
    }, [collectionId, itemId, nftChain, nftItems, owner, modalContent, nftDetail]);

  const nftItem = useMemo((): NftItem => {
    const { collectionId,
      itemId,
      nftChain,
      owner } = currentNftDetails;

    return nftItems.find(
      (item) =>
        isSameAddress(item.owner, owner) &&
        nftChain === item.chain &&
        item.collectionId === collectionId &&
        item.id === itemId
    ) || DEFAULT_ITEM;
  }, [currentNftDetails]);

  const collectionInfo = useMemo((): NftCollection => {
    const { collectionId,
      nftChain } = currentNftDetails;

    return nftCollections.find(
      (item) =>
        nftChain === item.chain &&
      item.collectionId === collectionId
    ) || DEFAULT_COLLECTION;
  }, [currentNftDetails, nftCollections]);

  const chainInfo = useMemo(() => chainInfoMap[nftChain], [chainInfoMap, nftChain]);
  const addressPrefix = useGetChainPrefixBySlug(nftChain);

  const { chain, from, onDone, setChain, setFrom } = useContext(TransactionContext);

  console.log('%c Rainbowww!', 'font-weight: bold; font-size: 50px;color: red; text-shadow: 3px 3px 0 rgb(217,31,38) , 6px 6px 0 rgb(226,91,14) , 9px 9px 0 rgb(245,221,8) , 12px 12px 0 rgb(5,148,68) , 15px 15px 0 rgb(2,135,206) , 18px 18px 0 rgb(4,77,145) , 21px 21px 0 rgb(42,21,113); margin-bottom: 12px; padding: 5%;');
  console.log('==>>', { chain, from, onDone, setChain, setFrom });

  const { onError, onSuccess } = useHandleSubmitTransaction(onDone);

  const [form] = Form.useForm<SendNFTFormProps>();
  const formDefault = useMemo(() => {
    return {
      from,
      chain,
      to: ''
    };
  }, [chain, from]);

  const [isDisable, setIsDisable] = useState(true);
  const [loading, setLoading] = useState(false);

  const recipientValidator = useCallback(({ getFieldValue }: FormInstance<SendNFTFormProps>) => {
    return ({
      validator: (rule: FormRule, _recipientAddress: string): Promise<void> => {
        if (!_recipientAddress) {
          return Promise.reject(t('The recipient address is required'));
        }

        if (!isAddress(_recipientAddress)) {
          return Promise.reject(t('Invalid recipient address'));
        }

        if (isSameAddress(_recipientAddress, from)) {
          return Promise.reject(t('The recipient address can not be the same as the sender address'));
        }

        if (isEthereumAddress(_recipientAddress) !== isEthereumAddress(from)) {
          const message = isEthereumAddress(from) ? t('Receive address must be of evm account.') : t('Receive address must be of substrate account.');

          return Promise.reject(message);
        }

        return Promise.resolve();
      }
    });
  }, [t, from]);

  const onFieldsChange: FormCallbacks<SendNFTFormProps>['onFieldsChange'] = useCallback((changedFields: FormFieldData[], allFields: FormFieldData[]) => {
    const { error } = simpleCheckForm(allFields);

    setIsDisable(error);
  }, []);

  // Submit transaction
  const onSubmit: FormCallbacks<SendNFTFormProps>['onFinish'] = useCallback(
    (values: SendNFTFormProps) => {
      const isEthereumInterface = isEthereumAddress(from);
      const { to } = values;
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
    [chain, from, nftItem, onError, onSuccess]
  );

  const preCheckReadOnly = usePreCheckReadOnly(from);

  useEffect(() => {
    setChain(nftChain);
    setFrom(owner);
  }, [nftChain, owner, setChain, setFrom]);

  useEffect(() => {
    if (nftItem === DEFAULT_ITEM || collectionInfo === DEFAULT_COLLECTION) {
      navigate('/home/nfts/collections');
    }
  }, [collectionInfo, navigate, nftItem]);

  // Focus to the first field
  useFocusFormItem(form, 'to');

  return (
    <>
      <TransactionContent className={CN('-transaction-content')}>
        <div className={CN('nft_item_detail text-center', {
          '__modal-ui': modalContent
        })}
        >
          <Image
            height={modalContent ? 180 : 120}
            src={nftItem.image}
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
          <Form.Item
            name={'to'}
            rules={[
              recipientValidator
            ]}
            statusHelpAsTooltip={true}
          >
            <AddressInput
              addressPrefix={addressPrefix}
              label={t('Send to')}
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
        errors={[]}
        warnings={[]}
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
          onClick={preCheckReadOnly(form.submit)}
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
    }
  };
});

export default SendNFT;
