// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountSelector } from '@subwallet/extension-koni-ui/components/Field/AccountSelector';
import { AddressInput } from '@subwallet/extension-koni-ui/components/Field/AddressInput';
import { ChainSelector } from '@subwallet/extension-koni-ui/components/Field/ChainSelector';
import { TokenItemType, TokenSelector } from '@subwallet/extension-koni-ui/components/Field/TokenSelector';
import { checkTransfer, makeTransfer } from '@subwallet/extension-koni-ui/messaging';
import FreeBalance from '@subwallet/extension-koni-ui/Popup/Transaction/parts/FreeBalance';
import TransactionContent from '@subwallet/extension-koni-ui/Popup/Transaction/parts/TransactionContent';
import TransactionFooter from '@subwallet/extension-koni-ui/Popup/Transaction/parts/TransactionFooter';
import { TransactionContext, TransactionFormBaseProps } from '@subwallet/extension-koni-ui/Popup/Transaction/Transaction';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ChainItemType } from '@subwallet/extension-koni-ui/types/network';
import { Button, Form, Input } from '@subwallet/react-ui';
import { useForm } from '@subwallet/react-ui/es/form/Form';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

interface TransferFromProps extends TransactionFormBaseProps {
  to: string
  chain: string
  token: string
  value: string
}

const _SendFund: React.FC = () => {
  const { t } = useTranslation();
  const chainInfoMap = useSelector((root: RootState) => root.chainStore.chainInfoMap);
  const assetRegistry = useSelector((root: RootState) => root.assetRegistry.assetRegistry);
  const transactionContext = useContext(TransactionContext);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [form] = useForm<TransferFromProps>();
  const formDefault = {
    from: transactionContext.from,
    chain: transactionContext.chain,
    to: '0x4b8D3Ee62C40D750F2FC9348593a93B49A21ED68',
    value: '0'
  };

  // Todo: Get predefined value from state (account, to address, chain)
  const chainList = useMemo<ChainItemType[]>(() => (
    Object.values(chainInfoMap).map(({ name, slug }) => ({ name, slug }))
  ), [chainInfoMap]);

  const tokenList = useMemo<TokenItemType[]>(() => (
    Object.values(assetRegistry).map(({ name, originChain, slug, symbol }) => ({ name, slug, originChain, symbol }))
  ), [assetRegistry]);

  const onFieldsChange = useCallback(
    ({ chain, from }: Partial<TransferFromProps>, values: TransferFromProps) => {
      if (from) {
        transactionContext.setFrom(from);
      }

      if (chain) {
        const chainInfo = chainInfoMap[chain];
        const tokenSlug = `${chain}-NATIVE-${chainInfo.substrateInfo?.symbol || chainInfo.evmInfo?.symbol || ''}`;

        transactionContext.setChain(chain);
        form.setFieldValue('token', tokenSlug);
      }
    },
    [chainInfoMap, form, transactionContext]
  );

  const submitTransaction = useCallback(
    () => {
      setLoading(true);
      const { chain, from, to, token, value } = form.getFieldsValue();

      checkTransfer({
        from,
        networkKey: chain,
        to: to,
        tokenSlug: token,
        value: value
      }).then(({ errors }) => {
        if (errors?.length) {
          setLoading(false);
          setErrors(errors.map((e) => e.message));
        } else {
          makeTransfer({
            from,
            networkKey: chain,
            to: to,
            tokenSlug: token,
            value: value
          }).then(({ errors, extrinsicHash }) => {
            setLoading(false);

            if (errors?.length) {
              setErrors(errors.map((e) => e.message));
            } else if (extrinsicHash) {
              transactionContext.onDone(extrinsicHash);
            }
          }).catch(console.error);
        }
      }).catch((e: Error) => {
        setLoading(false);
        setErrors([e.message]);
      });
    },
    [form, transactionContext]
  );

  return (
    <>
      <TransactionContent>
        <Form
          className='form-container'
          form={form}
          initialValues={formDefault}
          onValuesChange={onFieldsChange}
        >
          <Form.Item name={'from'}>
            <AccountSelector label={t('Send from account')} />
          </Form.Item>
          <Form.Item name={'chain'}>
            <ChainSelector items={chainList} />
          </Form.Item>
          <Form.Item name={'token'}>
            <TokenSelector items={tokenList} />
          </Form.Item>
          <Form.Item name={'value'}>
            <Input
              placeholder={t('value')}
            />
          </Form.Item>
          <Form.Item name={'to'}>
            <AddressInput label={t('Send to account')} />
          </Form.Item>
        </Form>
        <FreeBalance />
      </TransactionContent>
      <TransactionFooter errors={errors}>
        <Button
          loading={loading}
          onClick={submitTransaction}
        >
          {t('Next')}
        </Button>
      </TransactionFooter>
    </>
  );
};

const SendFund = styled(_SendFund)(({ theme }) => {
  return ({

  });
});

export default SendFund;
