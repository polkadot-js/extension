// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RequestYieldFastWithdrawal } from '@subwallet/extension-base/background/KoniTypes';
import { convertDerivativeToOriginToken } from '@subwallet/extension-base/koni/api/yield/helper/utils';
import { CommonTransactionInfo, MetaInfo } from '@subwallet/extension-web-ui/components';
import { useSelector } from '@subwallet/extension-web-ui/hooks';
import CN from 'classnames';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { BaseTransactionConfirmationProps } from './Base';

type Props = BaseTransactionConfirmationProps;

const Component: React.FC<Props> = (props: Props) => {
  const { className, transaction } = props;
  const { estimateFee } = transaction;
  const { amount, yieldPoolInfo } = transaction.data as RequestYieldFastWithdrawal;

  const { t } = useTranslation();

  const assetRegistry = useSelector((state) => state.assetRegistry.assetRegistry);

  const assetInfo = useMemo(() => {
    const tokenSlug = yieldPoolInfo.derivativeAssets?.[0];

    return assetRegistry[tokenSlug || ''];
  }, [assetRegistry, yieldPoolInfo.derivativeAssets]);

  const receivedAssetInfo = useMemo(() => {
    const tokenSlug = yieldPoolInfo.inputAssets?.[0];

    return assetRegistry[tokenSlug || ''];
  }, [assetRegistry, yieldPoolInfo.inputAssets]);

  const estimatedReceivables = useMemo(() => {
    const derivativeTokenSlug = yieldPoolInfo.derivativeAssets?.[0] || '';
    const originTokenSlug = yieldPoolInfo.inputAssets[0] || '';

    const derivativeTokenInfo = assetRegistry[derivativeTokenSlug];
    const originTokenInfo = assetRegistry[originTokenSlug];

    return convertDerivativeToOriginToken(amount, yieldPoolInfo, derivativeTokenInfo, originTokenInfo);
  }, [amount, assetRegistry, yieldPoolInfo]);

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
          decimals={assetInfo.decimals || 0}
          label={t('Amount')}
          suffix={assetInfo.symbol}
          value={amount}
        />
        <MetaInfo.Number
          decimals={receivedAssetInfo.decimals || 0}
          label={t('Estimated receivables')}
          suffix={receivedAssetInfo.symbol}
          value={estimatedReceivables}
        />
        {
          estimateFee && (
            <MetaInfo.Number
              decimals={estimateFee.decimals}
              label={t('Estimated fee')}
              suffix={estimateFee.symbol}
              value={estimateFee.value}
            />
          )
        }
      </MetaInfo>
    </div>
  );
};

const YieldPoolLeaveTransactionConfirmation = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {};
});

export default YieldPoolLeaveTransactionConfirmation;
