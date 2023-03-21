// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RequestStakePoolingBonding } from '@subwallet/extension-base/background/KoniTypes';
import { _getChainNativeTokenBasicInfo } from '@subwallet/extension-base/services/chain-service/utils';
import CommonTransactionInfo from '@subwallet/extension-koni-ui/components/Confirmation/CommonTransactionInfo';
import MetaInfo from '@subwallet/extension-koni-ui/components/MetaInfo';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import CN from 'classnames';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { BaseTransactionConfirmationProps } from './Base';

type Props = BaseTransactionConfirmationProps;

const Component: React.FC<Props> = (props: Props) => {
  const { className, transaction } = props;
  const data = transaction.data as RequestStakePoolingBonding;

  console.log('transaction', transaction);

  const { t } = useTranslation();

  const { chainInfoMap } = useSelector((state: RootState) => state.chainStore);

  const chainInfo = useMemo(() => {
    return chainInfoMap[transaction.chain];
  }, [chainInfoMap, transaction.chain]);

  const { decimals, symbol } = useMemo(() => {
    return _getChainNativeTokenBasicInfo(chainInfo);
  }, [chainInfo]);

  return (
    <div className={CN(className)}>
      <CommonTransactionInfo
        address={transaction.address}
        network={transaction.chain}
      />
      <MetaInfo
        className={'meta-info'}
        hasBackgroundWrapper
      >
        {/* <MetaInfo.Account */}
        {/*   address={'5DnokDpMdNEH8cApsZoWQnjsggADXQmGWUb6q8ZhHeEwvncL'} */}
        {/*   label={t('Validator')} */}
        {/*   networkPrefix={42} */}
        {/* /> */}

        {/* <MetaInfo.AccountGroup */}
        {/*  accounts={data.address} */}
        {/*  content={t(`${data.selectedValidators.length} selected validators`)} */}
        {/*  label={t('Pool')} */}
        {/* /> */}

        <MetaInfo.Number
          decimals={decimals}
          label={t('Amount')}
          suffix={symbol}
          value={data.amount}
        />

        <MetaInfo.Number
          decimals={chainInfo?.substrateInfo?.decimals || 0}
          label={t('Estimated fee')}
          suffix={chainInfo?.substrateInfo?.symbol}
          value={transaction.estimateFee?.value || 0}
        />
      </MetaInfo>
    </div>
  );
};

const StakeTransactionConfirmation = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {};
});

export default StakeTransactionConfirmation;
