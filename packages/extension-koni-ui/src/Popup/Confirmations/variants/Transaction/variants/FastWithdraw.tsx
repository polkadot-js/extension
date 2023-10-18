// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RequestYieldFastWithdrawal } from '@subwallet/extension-base/background/KoniTypes';
import { CommonTransactionInfo, MetaInfo } from '@subwallet/extension-koni-ui/components';
import { useSelector } from '@subwallet/extension-koni-ui/hooks';
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

  const { assetRegistry } = useSelector((state) => state.assetRegistry);

  const assetInfo = useMemo(() => {
    const tokenSlug = yieldPoolInfo.slug === 'DOT___interlay_lending' ? yieldPoolInfo.inputAssets?.[0] : yieldPoolInfo.derivativeAssets?.[0];

    return assetRegistry[tokenSlug || ''];
  }, [assetRegistry, yieldPoolInfo.derivativeAssets, yieldPoolInfo.inputAssets, yieldPoolInfo.slug]);

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

const FastWithdrawTransactionConfirmation = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {};
});

export default FastWithdrawTransactionConfirmation;
