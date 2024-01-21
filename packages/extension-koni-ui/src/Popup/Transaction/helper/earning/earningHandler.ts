// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SpecialYieldPoolInfo, SubmitYieldStepData, YieldPoolInfo, YieldTokenBaseInfo } from '@subwallet/extension-base/types';
import { TFunction } from 'react-i18next';

export function getUnstakingPeriod (t: TFunction, unstakingPeriod?: number) {
  if (unstakingPeriod) {
    const days = unstakingPeriod / 24;

    if (days < 1) {
      return t('{{time}} hours', { replace: { time: unstakingPeriod } });
    } else {
      return t('{{time}} days', { replace: { time: days } });
    }
  }

  return '';
}

export function getJoinYieldParams (
  _poolInfo: YieldPoolInfo,
  address: string,
  amount: string,
  feeStructure: YieldTokenBaseInfo
): SubmitYieldStepData {
  const poolInfo = _poolInfo as SpecialYieldPoolInfo;
  const exchangeRate = poolInfo?.statistic?.assetEarning[0]?.exchangeRate || 0;

  return {
    slug: poolInfo.slug,
    exchangeRate,
    address,
    amount,
    inputTokenSlug: poolInfo.metadata.inputAsset,
    derivativeTokenSlug: poolInfo?.metadata?.derivativeAssets?.[0], // TODO
    rewardTokenSlug: poolInfo?.metadata?.rewardAssets[0] || '',
    feeTokenSlug: feeStructure.slug
  };
}
