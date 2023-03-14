// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { AccountSelector } from '@subwallet/extension-koni-ui/components/Field/AccountSelector';
import AmountInput from '@subwallet/extension-koni-ui/components/Field/AmountInput';
import PoolSelector from '@subwallet/extension-koni-ui/components/Field/PoolSelector';
import BondedBalance from '@subwallet/extension-koni-ui/Popup/Transaction/parts/BondedBalance';
import FreeBalance from '@subwallet/extension-koni-ui/Popup/Transaction/parts/FreeBalance';
import TransactionContent from '@subwallet/extension-koni-ui/Popup/Transaction/parts/TransactionContent';
import TransactionFooter from '@subwallet/extension-koni-ui/Popup/Transaction/parts/TransactionFooter';
import { TransactionContext, TransactionFormBaseProps } from '@subwallet/extension-koni-ui/Popup/Transaction/Transaction';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { isAccountAll } from '@subwallet/extension-koni-ui/util';
import { Button, Form, Icon } from '@subwallet/react-ui';
import { useForm } from '@subwallet/react-ui/es/form/Form';
import { MinusCircle } from 'phosphor-react';
import React, { useCallback, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

type Props = ThemeProps

interface StakeFromProps extends TransactionFormBaseProps {
  token: string
  value: string
}

const Component: React.FC<Props> = (props: Props) => {
  const { className = '' } = props;
  const transactionContext = useContext(TransactionContext);
  const currentAccount = useSelector((state: RootState) => state.accountState.currentAccount);
  const isAll = isAccountAll(currentAccount?.address || '');
  const [form] = useForm<StakeFromProps>();
  const formDefault = {
    from: transactionContext.from,
    value: '0'
  };

  useEffect(() => {
    transactionContext.setTransactionType(ExtrinsicType.STAKING_UNSTAKE);
  }, [transactionContext]);

  const onFieldsChange = useCallback(({ from }: Partial<StakeFromProps>, values: StakeFromProps) => {
    // TODO: field change
  }, []);

  const { t } = useTranslation();

  const submitTransaction = useCallback(() => {
    // TODO: submit transaction
  }, []);

  return (
    <>
      <TransactionContent>
        <Form
          className={`${className} form-container form-space-sm`}
          form={form}
          initialValues={formDefault}
          onValuesChange={onFieldsChange}
        >

          <BondedBalance
            bondedBalance={'0'}
            className={'bonded-balance'}
          />

          {isAll &&
            <Form.Item name={'from'}>
              <AccountSelector label={t('Unstake from account')} />
            </Form.Item>
          }

          <Form.Item name={'pool'}>
            <PoolSelector
              chain={'polkadot'}
              label={t('Select validator')}
            />
          </Form.Item>

          <FreeBalance
            className={'free-balance'}
            label={t('Transferable:')}
          />

          <Form.Item name={'value'}>
            <AmountInput
              decimals={10}
              maxValue={'10000'}
            />
          </Form.Item>

          <div className={'text-light-4'}>{t('Once unbonded, your funds to become available after 28 days.')}</div>
        </Form>
      </TransactionContent>
      <TransactionFooter
        errors={[]}
        warnings={[]}
      >
        <Button
          icon={<Icon
            phosphorIcon={MinusCircle}
            weight={'fill'}
          />}
          loading={false}
          onClick={submitTransaction}
        >
          {t('Submit')}
        </Button>
      </TransactionFooter>
    </>
  );
};

const Unstake = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.bonded-balance, .free-balance': {
      marginBottom: token.marginXS
    },

    '.meta-info': {
      marginTop: token.paddingSM
    }
  };
});

export default Unstake;
