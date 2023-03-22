// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { _getChainNativeTokenBasicInfo } from '@subwallet/extension-base/services/chain-service/utils';
import { MetaInfo, ValidatorSelector } from '@subwallet/extension-koni-ui/components';
import { AccountSelector } from '@subwallet/extension-koni-ui/components/Field/AccountSelector';
import AmountInput from '@subwallet/extension-koni-ui/components/Field/AmountInput';
import { StakingDataOption } from '@subwallet/extension-koni-ui/Popup/Home/Staking/MoreActionModal';
import { getUnstakingInfo } from '@subwallet/extension-koni-ui/Popup/Home/Staking/StakingDetailModal';
import FreeBalance from '@subwallet/extension-koni-ui/Popup/Transaction/parts/FreeBalance';
import TransactionContent from '@subwallet/extension-koni-ui/Popup/Transaction/parts/TransactionContent';
import TransactionFooter from '@subwallet/extension-koni-ui/Popup/Transaction/parts/TransactionFooter';
import { TransactionContext, TransactionFormBaseProps } from '@subwallet/extension-koni-ui/Popup/Transaction/Transaction';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { isAccountAll } from '@subwallet/extension-koni-ui/util';
import { Button, Form, Icon, Number } from '@subwallet/react-ui';
import { ArrowCircleRight, XCircle } from 'phosphor-react';
import React, { useCallback, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
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
  const chainInfoMap = useSelector((state: RootState) => state.chainStore.chainInfoMap);
  const location = useLocation();
  const { chainStakingMetadata, nominatorMetadata } = location.state as StakingDataOption;
  const isAll = isAccountAll(currentAccount?.address || '');
  const [form] = Form.useForm<StakeFromProps>();
  const formDefault = {
    from: transactionContext.from,
    value: '0'
  };
  const unstakingInfo = nominatorMetadata && getUnstakingInfo(nominatorMetadata.unstakings, form.getFieldsValue().from);
  const chainInfo = chainStakingMetadata && chainInfoMap[chainStakingMetadata.chain];
  const { decimals, symbol } = _getChainNativeTokenBasicInfo(chainInfo as _ChainInfo);

  useEffect(() => {
    transactionContext.setTransactionType(ExtrinsicType.STAKING_CANCEL_UNSTAKE);
    transactionContext.setChain(chainStakingMetadata ? chainStakingMetadata.chain : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          {isAll &&
            <Form.Item name={'from'}>
              <AccountSelector />
            </Form.Item>
          }

          <FreeBalance
            address={transactionContext.from}
            chain={transactionContext.chain}
            className={'free-balance'}
            label={t('Transferable:')}
          />

          <Form.Item name={'collator'}>
            <ValidatorSelector
              chain={'polkadot'}
              label={t('Select collator')}
            />
          </Form.Item>

          <MetaInfo
            className={'unstaked-field'}
            labelColorScheme={'gray'}
            spaceSize={'sm'}
            valueColorScheme={'gray'}
          >
            <MetaInfo.Default
              className={'cancel-unstake-info-item'}
              label={t('Unstaked:')}
              valueAlign={'left'}
            >
              <Number
                decimal={decimals}
                suffix={symbol}
                value={unstakingInfo?.claimable || '0'}
              />
            </MetaInfo.Default>
          </MetaInfo>

          <Form.Item name={'value'}>
            <AmountInput
              decimals={decimals}
              maxValue={'10000'}
            />
          </Form.Item>

          <MetaInfo
            labelColorScheme={'gray'}
            valueColorScheme={'gray'}
          >
            <MetaInfo.Default
              className={'cancel-unstake-info-item'}
              label={t('Transaction fee:')}
              valueAlign={'left'}
            >
              <Number
                decimal={10}
                suffix={symbol}
                value={'20000'}
              />
            </MetaInfo.Default>
          </MetaInfo>
        </Form>
      </TransactionContent>
      <TransactionFooter
        errors={[]}
        warnings={[]}
      >
        <Button
          icon={<Icon
            phosphorIcon={XCircle}
            weight={'fill'}
          />}
          loading={false}
          onClick={submitTransaction}
          schema={'secondary'}
        >
          {t('Cancel')}
        </Button>

        <Button
          icon={<Icon
            phosphorIcon={ArrowCircleRight}
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

const CancelUnstake = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.unstaked-field, .free-balance': {
      marginBottom: token.marginXS
    },

    '.meta-info': {
      marginTop: token.paddingSM
    },

    '.cancel-unstake-info-item > .__col': {
      flex: 'initial',
      paddingRight: token.paddingXXS
    }
  };
});

export default CancelUnstake;
