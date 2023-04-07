// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RequestStakeClaimReward } from '@subwallet/extension-base/background/KoniTypes';
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
  const data = transaction.data as RequestStakeClaimReward;

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
        {
          data.unclaimedReward && <MetaInfo.Number
            decimals={decimals}
            label={t('Unclaimed reward')}
            suffix={symbol}
            value={data.unclaimedReward}
          />
        }

        <MetaInfo.Number
          decimals={decimals}
          label={t('Transaction fee')}
          suffix={symbol}
          value={transaction.estimateFee?.value || 0}
        />
      </MetaInfo>

      <span className={'text-light-4'}>
        {
          data.bondReward
            ? t('Your rewards will be bonded back into the pool')
            : t('Withdrawing rewards will immediately transfer them to your account as free balance')
        }
      </span>
    </div>
  );
};

const ClaimRewardTransactionConfirmation = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.meta-info': {
      marginBottom: token.marginSM
    }
  };
});

export default ClaimRewardTransactionConfirmation;
