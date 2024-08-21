// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TokenSpendingApprovalParams } from '@subwallet/extension-base/types';
import { CommonTransactionInfo, MetaInfo } from '@subwallet/extension-web-ui/components';
import { useGetNativeTokenBasicInfo } from '@subwallet/extension-web-ui/hooks';
import CN from 'classnames';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { BaseTransactionConfirmationProps } from './Base';

type Props = BaseTransactionConfirmationProps;

const Component: React.FC<Props> = (props: Props) => {
  const { className, transaction } = props;
  const { t } = useTranslation();

  const txParams = useMemo((): TokenSpendingApprovalParams => transaction.data as TokenSpendingApprovalParams, [transaction.data]);
  const { decimals, symbol } = useGetNativeTokenBasicInfo(transaction.chain);

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
        {
          (
            <MetaInfo.Account
              address={txParams.contractAddress}
              label={t('Contract')}
            />
          )
        }

        {
          (
            <MetaInfo.Account
              address={txParams.spenderAddress}
              label={t('Spender contract')}
            />
          )
        }
        <MetaInfo.Number
          decimals={decimals}
          label={t('Estimated fee')}
          suffix={symbol}
          value={transaction.estimateFee?.value || 0}
        />
      </MetaInfo>
    </div>
  );
};

const TokenApproveConfirmation = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {

  };
});

export default TokenApproveConfirmation;
