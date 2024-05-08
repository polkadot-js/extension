// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NotificationType } from '@subwallet/extension-base/background/KoniTypes';
import { RequestStakeClaimReward } from '@subwallet/extension-base/types';
import { CommonTransactionInfo, MetaInfo, PageWrapper } from '@subwallet/extension-web-ui/components';
import { DataContext } from '@subwallet/extension-web-ui/contexts/DataContext';
import { useGetNativeTokenBasicInfo, useSelector } from '@subwallet/extension-web-ui/hooks';
import BigN from 'bignumber.js';
import CN from 'classnames';
import { CheckCircle } from 'phosphor-react';
import React, { useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { BaseTransactionConfirmationProps } from './Base';

type Props = BaseTransactionConfirmationProps;

const Component: React.FC<Props> = (props: Props) => {
  const { closeAlert, openAlert, transaction } = props;
  const { t } = useTranslation();
  const data = transaction.data as RequestStakeClaimReward;

  const { poolInfoMap } = useSelector((state) => state.earning);
  const poolInfo = poolInfoMap[data.slug];

  const { decimals, symbol } = useGetNativeTokenBasicInfo(poolInfo.chain);

  useEffect(() => {
    const isRewardLteFee = new BigN(data.unclaimedReward || 0).lte(transaction.estimateFee?.value || 0);
    const isRewardLtFee = new BigN(data.unclaimedReward || 0).lt(transaction.estimateFee?.value || 0);

    if (isRewardLteFee) {
      // todo: will convert message to key for i18n later
      openAlert({
        title: t('Pay attention!'),
        type: NotificationType.WARNING,
        content: t(`The rewards you are about to claim are ${
          isRewardLtFee ? 'smaller than' : 'equal to'
        } the transaction fee. This means that you won’t receive any rewards after claiming. Do you wish to continue?`),
        okButton: {
          text: t('I understand'),
          onClick: closeAlert,
          icon: CheckCircle
        }
      });
    }
  }, [closeAlert, data.unclaimedReward, openAlert, t, transaction.estimateFee?.value]);

  return (
    <>
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
            label={t('Available rewards')}
            suffix={symbol}
            value={data.unclaimedReward}
          />
        }

        <MetaInfo.Number
          decimals={decimals}
          label={t('Estimated fee')}
          suffix={symbol}
          value={transaction.estimateFee?.value || 0}
        />
      </MetaInfo>

      <span className={CN('text-light-4')}>
        {
          data.bondReward
            ? t('Your rewards will be staked back into the pool after claiming')
            : t('Your rewards will be added to your transferable balance after claiming')
        }
      </span>
    </>
  );
};

// earning store does not have data from the beginning => need Wrapper to protect app from crashing
const Wrapper = (props: Props) => {
  const dataContext = useContext(DataContext);

  return (
    <PageWrapper
      className={CN(props.className)}
      hideLoading={true}
      resolve={dataContext.awaitStores(['earning'])}
    >
      <Component {...props} />
    </PageWrapper>
  );
};

const ClaimRewardTransactionConfirmation = styled(Wrapper)<Props>(({ theme: { token } }: Props) => {
  return {
    textAlign: 'left',

    '.meta-info': {
      marginBottom: token.marginSM
    }
  };
});

export default ClaimRewardTransactionConfirmation;
