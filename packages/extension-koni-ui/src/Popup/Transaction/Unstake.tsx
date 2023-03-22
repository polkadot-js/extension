// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NominatorMetadata, RequestUnbondingSubmit } from '@subwallet/extension-base/background/KoniTypes';
import { isUnbondFromValidator } from '@subwallet/extension-base/koni/api/staking/bonding/utils';
import { _getChainNativeTokenBasicInfo } from '@subwallet/extension-base/services/chain-service/utils';
import { AccountSelector } from '@subwallet/extension-koni-ui/components/Field/AccountSelector';
import AmountInput from '@subwallet/extension-koni-ui/components/Field/AmountInput';
import PoolSelector from '@subwallet/extension-koni-ui/components/Field/PoolSelector';
import useFetchChainInfo from '@subwallet/extension-koni-ui/hooks/screen/common/useFetchChainInfo';
import { submitUnbonding } from '@subwallet/extension-koni-ui/messaging';
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
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';

type Props = ThemeProps

interface StakeFromProps extends TransactionFormBaseProps {
  token: string
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
  const chainInfo = useFetchChainInfo(nominatorMetadata.chain);
  const { decimals } = useMemo(() => {
    return _getChainNativeTokenBasicInfo(chainInfo);
  }, [chainInfo]);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  const mustChooseValidator = useCallback(() => {
    return isUnbondFromValidator(nominatorMetadata);
  }, [nominatorMetadata]);

  const [form] = Form.useForm<StakeFromProps>();
  const formDefault = {
    from: transactionContext.from,
    value: '0'
  };

  const onFieldsChange = useCallback(({ from }: Partial<StakeFromProps>, values: StakeFromProps) => {
    // TODO: field change
  }, []);

  const { t } = useTranslation();

  const submitTransaction = useCallback(() => {
    const value = form.getFieldValue('value') as string;
    const selectedValidator = nominatorMetadata.nominations[0].validatorAddress;

    const params: RequestUnbondingSubmit = {
      amount: value,
      chain: nominatorMetadata.chain,
      nominatorMetadata
    };

    if (mustChooseValidator()) {
      params.validatorAddress = ''; // TODO
    }

    submitUnbonding(params)
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
            chainInfo={chainInfo}
            className={'bonded-balance'}
          />

          {isAll &&
            <Form.Item name={'from'}>
              <AccountSelector label={t('Unstake from account')} />
            </Form.Item>
          }

          <Form.Item name={'validator'}>
            <PoolSelector
              chain={nominatorMetadata.chain}
              label={t('Select validator')}
            />
          </Form.Item>

          <FreeBalance
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
