// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NominatorMetadata, RequestStakePoolingUnbonding, RequestUnbondingSubmit, StakingType } from '@subwallet/extension-base/background/KoniTypes';
import { isActionFromValidator } from '@subwallet/extension-base/koni/api/staking/bonding/utils';
import { SWTransactionResponse } from '@subwallet/extension-base/services/transaction-service/types';
import { AccountSelector } from '@subwallet/extension-koni-ui/components/Field/AccountSelector';
import AmountInput from '@subwallet/extension-koni-ui/components/Field/AmountInput';
import PoolSelector from '@subwallet/extension-koni-ui/components/Field/PoolSelector';
import useGetNativeTokenBasicInfo from '@subwallet/extension-koni-ui/hooks/common/useGetNativeTokenBasicInfo';
import { submitPoolUnbonding, submitUnbonding } from '@subwallet/extension-koni-ui/messaging';
import { StakingDataOption } from '@subwallet/extension-koni-ui/Popup/Home/Staking/MoreActionModal';
import BondedBalance from '@subwallet/extension-koni-ui/Popup/Transaction/parts/BondedBalance';
import FreeBalance from '@subwallet/extension-koni-ui/Popup/Transaction/parts/FreeBalance';
import TransactionContent from '@subwallet/extension-koni-ui/Popup/Transaction/parts/TransactionContent';
import TransactionFooter from '@subwallet/extension-koni-ui/Popup/Transaction/parts/TransactionFooter';
import { TransactionContext, TransactionFormBaseProps } from '@subwallet/extension-koni-ui/Popup/Transaction/Transaction';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { isAccountAll } from '@subwallet/extension-koni-ui/util';
import { Button, Form, Icon } from '@subwallet/react-ui';
import { MinusCircle } from 'phosphor-react';
import React, { useCallback, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';

type Props = ThemeProps

interface UnstakeFromProps extends TransactionFormBaseProps {
  token: string,
  value: string,
  validator?: string,
  from: string
}

const Component: React.FC<Props> = (props: Props) => {
  const { className = '' } = props;
  const transactionContext = useContext(TransactionContext);
  const currentAccount = useSelector((state: RootState) => state.accountState.currentAccount);
  const isAll = isAccountAll(currentAccount?.address || '');
  const location = useLocation();
  const [locationState] = useState<StakingDataOption>(location?.state as StakingDataOption);
  const [nominatorMetadata] = useState(locationState?.nominatorMetadata as NominatorMetadata);
  const { decimals, symbol } = useGetNativeTokenBasicInfo(nominatorMetadata.chain);

  const [, setLoading] = useState(false);
  const [, setErrors] = useState<string[]>([]);
  const [, setWarnings] = useState<string[]>([]);

  const mustChooseValidator = useCallback(() => {
    return isActionFromValidator(nominatorMetadata);
  }, [nominatorMetadata]);

  const [form] = Form.useForm<UnstakeFromProps>();
  const formDefault = {
    from: transactionContext.from,
    value: '0'
  };

  const onFieldsChange = useCallback(({ from }: Partial<UnstakeFromProps>, values: UnstakeFromProps) => {
    // TODO: field change
  }, []);

  const { t } = useTranslation();

  const submitTransaction = useCallback(() => {
    const value = form.getFieldValue('value') as string;
    // const selectedValidator = nominatorMetadata.nominations[0].validatorAddress;

    let unbondingPromise: Promise<SWTransactionResponse>;

    if (nominatorMetadata.type === StakingType.POOLED) {
      const params: RequestStakePoolingUnbonding = {
        amount: value,
        chain: nominatorMetadata.chain,
        nominatorMetadata
      };

      unbondingPromise = submitPoolUnbonding(params);
    } else {
      const params: RequestUnbondingSubmit = {
        amount: value,
        chain: nominatorMetadata.chain,
        nominatorMetadata
      };

      if (mustChooseValidator()) {
        params.validatorAddress = ''; // TODO
      }

      unbondingPromise = submitUnbonding(params);
    }

    unbondingPromise
      .then((result) => {
        const { errors, extrinsicHash, warnings } = result;

        if (errors.length || warnings.length) {
          setLoading(false);
          setErrors(errors.map((e) => e.message));
          setWarnings(warnings.map((w) => w.message));
        } else if (extrinsicHash) {
          transactionContext.onDone(extrinsicHash);
        }
      })
      .catch((e: Error) => {
        setLoading(false);
        setErrors([e.message]);
      });
  }, [form, mustChooseValidator, nominatorMetadata, transactionContext]);

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
            bondedBalance={nominatorMetadata.activeStake}
            className={'bonded-balance'}
            decimals={decimals}
            symbol={symbol}
          />

          {isAll &&
            <Form.Item name={'from'}>
              <AccountSelector label={t('Unstake from account')} />
            </Form.Item>
          }

          <Form.Item name={'validator'}>
            <PoolSelector
              chain={transactionContext.chain}
              from={transactionContext.from}
              label={t('Select validator')}
            />
          </Form.Item>

          <FreeBalance
            address={transactionContext.from}
            chain={transactionContext.chain}
            className={'free-balance'}
            label={t('Transferable:')}
          />

          <Form.Item name={'value'}>
            <AmountInput
              decimals={decimals}
              maxValue={nominatorMetadata.activeStake}
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

const Unbond = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.bonded-balance, .free-balance': {
      marginBottom: token.marginXS
    },

    '.meta-info': {
      marginTop: token.paddingSM
    }
  };
});

export default Unbond;
