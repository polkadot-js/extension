// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { _getChainNativeTokenBasicInfo } from '@subwallet/extension-base/services/chain-service/utils';
import { MetaInfo } from '@subwallet/extension-koni-ui/components';
import { AccountSelector } from '@subwallet/extension-koni-ui/components/Field/AccountSelector';
import { StakingDataOption } from '@subwallet/extension-koni-ui/Popup/Home/Staking/MoreActionModal';
import FreeBalance from '@subwallet/extension-koni-ui/Popup/Transaction/parts/FreeBalance';
import TransactionContent from '@subwallet/extension-koni-ui/Popup/Transaction/parts/TransactionContent';
import TransactionFooter from '@subwallet/extension-koni-ui/Popup/Transaction/parts/TransactionFooter';
import { TransactionContext, TransactionFormBaseProps } from '@subwallet/extension-koni-ui/Popup/Transaction/Transaction';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { isAccountAll } from '@subwallet/extension-koni-ui/util';
import { Button, Checkbox, Form, Icon } from '@subwallet/react-ui';
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
  const { chainStakingMetadata } = location.state as StakingDataOption;
  const isAll = isAccountAll(currentAccount?.address || '');
  const [form] = Form.useForm<StakeFromProps>();
  const formDefault = {
    from: transactionContext.from,
    value: '0'
  };

  const chainInfo = chainStakingMetadata && chainInfoMap[chainStakingMetadata.chain];
  const { decimals, symbol } = _getChainNativeTokenBasicInfo(chainInfo as _ChainInfo);

  useEffect(() => {
    transactionContext.setTransactionType(ExtrinsicType.STAKING_CLAIM_REWARD);
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
            className={'free-balance'}
            label={t('Transferable:')}
          />

          <MetaInfo
            className={'meta-info'}
            hasBackgroundWrapper
          >
            <MetaInfo.Chain
              chain={chainInfo?.slug || ''}
              chainName={chainInfo?.name || ''}
              label={t('Network')}
            />

            <MetaInfo.Number
              decimals={decimals}
              label={t('Reward claiming')}
              suffix={symbol}
              value={'10000'}
            />
            <MetaInfo.Number
              decimals={decimals}
              label={t('Reward claiming dee')}
              suffix={symbol}
              value={'10000'}
            />
          </MetaInfo>

          <Checkbox checked={false}>
            {t('Bond reward')}
          </Checkbox>
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

const ClaimReward = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.free-balance': {
      marginBottom: token.marginXS
    },

    '.meta-info': {
      marginBottom: token.marginSM
    }
  };
});

export default ClaimReward;
