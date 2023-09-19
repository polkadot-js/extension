// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType, TransactionAdditionalInfo } from '@subwallet/extension-base/background/KoniTypes';
import { MetaInfo } from '@subwallet/extension-koni-ui/components';
import { ThemeProps, TransactionHistoryDisplayItem } from '@subwallet/extension-koni-ui/types';
import { isTypeStaking } from '@subwallet/extension-koni-ui/utils';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

interface Props extends ThemeProps {
  data: TransactionHistoryDisplayItem;
}

const Component: React.FC<Props> = (props: Props) => {
  const { data } = props;
  const { amount, type: transactionType } = data;

  const { t } = useTranslation();

  const isStaking = isTypeStaking(data.type);
  const isCrowdloan = data.type === ExtrinsicType.CROWDLOAN;
  const isNft = data.type === ExtrinsicType.SEND_NFT;

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
