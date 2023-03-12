// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { SWTransactionResponse } from '@subwallet/extension-base/services/transaction-service/types';
import { AddressInput } from '@subwallet/extension-koni-ui/components/Field/AddressInput';
import { ChainSelector } from '@subwallet/extension-koni-ui/components/Field/ChainSelector';
import { evmNftSubmitTransaction, substrateNftSubmitTransaction } from '@subwallet/extension-koni-ui/messaging';
import { INftItemDetail } from '@subwallet/extension-koni-ui/Popup/Home/Nfts';
import nftParamsHandler from '@subwallet/extension-koni-ui/Popup/Transaction/helper/nftParamsHandler';
import FreeBalance from '@subwallet/extension-koni-ui/Popup/Transaction/parts/FreeBalance';
import TransactionContent from '@subwallet/extension-koni-ui/Popup/Transaction/parts/TransactionContent';
import TransactionFooter from '@subwallet/extension-koni-ui/Popup/Transaction/parts/TransactionFooter';
import { TransactionContext, TransactionFormBaseProps } from '@subwallet/extension-koni-ui/Popup/Transaction/Transaction';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Form, Icon, Image, Typography } from '@subwallet/react-ui';
import { Rule } from '@subwallet/react-ui/es/form';
import { useForm } from '@subwallet/react-ui/es/form/Form';
import CN from 'classnames';
import { ArrowCircleRight } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';

import { isEthereumAddress } from '@polkadot/util-crypto';

interface SendNFTFormProps extends TransactionFormBaseProps {
  to: string
}

type Props = ThemeProps;

const Component = ({ className = '' }: Props): React.ReactElement<Props> => {
  const { t } = useTranslation();
  const { collectionInfo, nftItem } = useLocation().state as INftItemDetail;
  const chainInfoMap = useSelector((state: RootState) => state.chainStore.chainInfoMap);
  const chainInfo = useMemo(() => chainInfoMap[collectionInfo.chain], [chainInfoMap, collectionInfo.chain]);

  const { chain, from, onDone, setChain, setFrom, setTransactionType } = useContext(TransactionContext);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [form] = useForm<SendNFTFormProps>();
  const formDefault = {
    from,
    chain,
    to: ''
  };

  const validateRecipientAddress = useCallback((rule: Rule, _recipientAddress: string): Promise<void> => {
    if (from === form.getFieldValue('to')) {
      return Promise.reject(t('The recipient address can not be the same as the sender address'));
    }

    return Promise.resolve();
  }, [form, from, t]);

  // Submit transaction
  const submitTransaction = useCallback(
    () => {
      const isEthereumInterface = isEthereumAddress(from);

      form.validateFields().then((values) => {
        setLoading(true);
        const { to } = values;
        const params = nftParamsHandler(nftItem, chain);
        let sendPromise: Promise<SWTransactionResponse>;

        if (isEthereumInterface) {
          // Send NFT with EVM interface
          sendPromise = evmNftSubmitTransaction({
            senderAddress: from,
            networkKey: chain,
            recipientAddress: to,
            params
          });
        } else {
          // Send NFT with substrate interface
          sendPromise = substrateNftSubmitTransaction({
            recipientAddress: to,
            senderAddress: from,
            params
          });
        }

        // Handle transfer action
        sendPromise.then((rs) => {
          const { errors, extrinsicHash, warnings } = rs;

          console.debug(rs);

          if (errors.length || warnings.length) {
            setLoading(false);
            setErrors(errors.map((e) => e.message));
            setWarnings(warnings.map((w) => w.message));
          } else if (extrinsicHash) {
            onDone(extrinsicHash);
          }
        }).catch((e: Error) => {
          setLoading(false);
          setErrors([e.message]);
        });
      }).catch(console.log);
    },
    [form, from, nftItem, onDone]
  );

  useEffect(() => {
    setTransactionType(ExtrinsicType.SEND_NFT);
    setChain(collectionInfo.chain);
    setFrom(nftItem.owner);
  }, [collectionInfo.chain, nftItem.owner, setChain, setFrom, setTransactionType]);

  return (
    <>
      <TransactionContent className={CN(`${className} -transaction-content`)}>
        <div className={'nft_item_detail text-center'}>
          <Image
            height={120}
            src={nftItem.image}
          />
          <Typography.Title level={5}>
            {nftItem.name}
          </Typography.Title>
        </div>

        <Form
          className={'form-container form-space-sm'}
          form={form}
          initialValues={formDefault}
        >
          <Form.Item
            name={'to'}
            rules={[
              {
                validator: validateRecipientAddress
              }
            ]}
            validateTrigger='onBlur'
          >
            <AddressInput
              label={t('Send to account')}
              showScanner={true}
            />
          </Form.Item>

          <Form.Item>
            <ChainSelector
              disabled={true}
              items={[{ name: chainInfo.name, slug: collectionInfo.chain }]}
              label={t('Network')}
              value={collectionInfo.chain}
            />
          </Form.Item>
        </Form>

        <FreeBalance />
      </TransactionContent>
      <TransactionFooter
        className={`${className}-transaction-footer`}
        errors={errors}
        warnings={warnings}
      >
        <Button
          icon={(
            <Icon
              phosphorIcon={ArrowCircleRight}
              weight={'fill'}
            />
          )}
          loading={loading}
          onClick={submitTransaction}
        >
          {t('Next')}
        </Button>
      </TransactionFooter>
    </>
  );
};

const SendNFT = styled(Component)(({ theme }) => {
  return ({
    '.nft_item_detail h5': {
      marginBottom: 16 // Not found 16 in margin token list
    }
  });
});

export default SendNFT;
