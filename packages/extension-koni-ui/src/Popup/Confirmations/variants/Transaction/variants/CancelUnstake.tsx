// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RequestStakeCancelWithdrawal } from '@subwallet/extension-base/background/KoniTypes';
import { CommonTransactionInfo, MetaInfo } from '@subwallet/extension-koni-ui/components';
import { useGetNativeTokenBasicInfo } from '@subwallet/extension-koni-ui/hooks';
import CN from 'classnames';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { BaseTransactionConfirmationProps } from './Base';

type Props = BaseTransactionConfirmationProps;

const Component: React.FC<Props> = (props: Props) => {
  const { className, transaction } = props;
  const data = transaction.data as RequestStakeCancelWithdrawal;

  const { t } = useTranslation();
  const { decimals, symbol } = useGetNativeTokenBasicInfo(data.chain);

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
        <MetaInfo.Number
          decimals={decimals}
          label={t('Amount')}
          suffix={symbol}
          value={data.selectedUnstaking.claimable}
        />

        <MetaInfo.Number
          decimals={decimals}
          label={t('Cancel unstake fee')}
          suffix={symbol}
          value={transaction.estimateFee?.value || 0}
        />
      </MetaInfo>
    </div>
  );
};

const CancelUnstakeTransactionConfirmation = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {};
});

export default CancelUnstakeTransactionConfirmation;
