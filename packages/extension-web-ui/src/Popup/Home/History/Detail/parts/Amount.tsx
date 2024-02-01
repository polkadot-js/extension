// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType, TransactionAdditionalInfo } from '@subwallet/extension-base/background/KoniTypes';
import { MetaInfo } from '@subwallet/extension-web-ui/components';
import { BN_TEN } from '@subwallet/extension-web-ui/constants';
import { useSelector } from '@subwallet/extension-web-ui/hooks';
import { ThemeProps, TransactionHistoryDisplayItem } from '@subwallet/extension-web-ui/types';
import { isPoolLeave, isTypeMint, isTypeStaking } from '@subwallet/extension-web-ui/utils';
import BigN from 'bignumber.js';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { PoolLeaveAmount } from './PoolLeaveAmount';

interface Props extends ThemeProps {
  data: TransactionHistoryDisplayItem;
}

const Component: React.FC<Props> = (props: Props) => {
  const { data } = props;
  const { amount, type: transactionType } = data;

  const { assetRegistry } = useSelector((state) => state.assetRegistry);

  const { t } = useTranslation();

  const isStaking = isTypeStaking(data.type);
  const isCrowdloan = data.type === ExtrinsicType.CROWDLOAN;
  const isNft = data.type === ExtrinsicType.SEND_NFT;
  const isMint = isTypeMint(data.type);
  const isLeavePool = isPoolLeave(data.type);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const additionalInfo = data.additionalInfo;

  const amountLabel = useMemo((): string => {
    switch (transactionType) {
      case ExtrinsicType.STAKING_BOND:
      case ExtrinsicType.STAKING_JOIN_POOL:
        return t('Staking value');
      case ExtrinsicType.STAKING_WITHDRAW:
      case ExtrinsicType.STAKING_POOL_WITHDRAW:
        return t('Withdraw value');
      case ExtrinsicType.STAKING_UNBOND:
        return t('Unstake value');
      case ExtrinsicType.STAKING_CANCEL_UNSTAKE:
        return t('Cancel unstake value');
      case ExtrinsicType.CROWDLOAN:
        return t('Contribute balance');
      default:
        return t('Amount');
    }
  }, [t, transactionType]);

  const derivativeTokenSlug = useMemo((): string | undefined => {
    if (isMint) {
      if (additionalInfo) {
        return (additionalInfo as TransactionAdditionalInfo[ExtrinsicType.MINT_QDOT])?.derivativeTokenSlug;
      } else {
        return undefined;
      }
    } else {
      return undefined;
    }
  }, [additionalInfo, isMint]);

  const amountDerivative = useMemo(() => {
    if (amount && derivativeTokenSlug && additionalInfo) {
      const rate = (additionalInfo as TransactionAdditionalInfo[ExtrinsicType.MINT_QDOT])?.exchangeRate;

      if (rate) {
        return new BigN(amount.value).div(BN_TEN.pow(amount.decimals)).div(rate);
      }
    }

    return undefined;
  }, [additionalInfo, amount, derivativeTokenSlug]);

  const derivativeSymbol = useMemo(() => {
    return derivativeTokenSlug ? assetRegistry[derivativeTokenSlug].symbol : '';
  }, [assetRegistry, derivativeTokenSlug]);

  if (isLeavePool && data.additionalInfo) {
    return <PoolLeaveAmount data={data} />;
  }

  return (
    <>
      {
        (isStaking || isCrowdloan || amount) &&
          (
            <MetaInfo.Number
              decimals={amount?.decimals || undefined}
              label={amountLabel}
              suffix={amount?.symbol || undefined}
              value={amount?.value || '0'}
            />
          )
      }
      {isMint && amountDerivative && (
        <MetaInfo.Number
          decimals={0}
          label={t('Estimated receivables')}
          suffix={derivativeSymbol}
          value={amountDerivative}
        />
      )}
      {data.additionalInfo && isNft && (
        <MetaInfo.Default
          label={t('Collection Name')}
        >
          {(data.additionalInfo as TransactionAdditionalInfo[ExtrinsicType.SEND_NFT]).collectionName}
        </MetaInfo.Default>
      )}
    </>
  );
};

const HistoryDetailAmount = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {};
});

export default HistoryDetailAmount;
