// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SpecialYieldPoolInfo, SubmitYieldStepData, UnstakingStatus, YieldPoolInfo, YieldTokenBaseInfo } from '@subwallet/extension-base/types';
// @ts-ignore
import humanizeDuration from 'humanize-duration';
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

export function getWaitingTime (waitingTime: number, status: UnstakingStatus, t: TFunction) {
  if (status === UnstakingStatus.CLAIMABLE) {
    return t('Available for withdrawal');
  } else {
    const waitingTimeInMs = waitingTime * 60 * 60 * 1000;

    // Formatted waitting time without round up
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
    const _formattedWaitingTime = humanizeDuration(waitingTimeInMs, {
      units: waitingTime >= 24 ? ['d', 'h'] : ['h', 'm'],
      round: false,
      delimiter: ' ',
      language: 'shortEn',
      languages: {
        shortEn: {
          y: () => 'y',
          mo: () => 'mo',
          w: () => 'w',
          d: () => 'd',
          h: () => 'hr',
          m: () => 'm',
          s: () => 's',
          ms: () => 'ms'
        }
      } // TODO: should not be shorten
    }) as string;

    // Formatted waitting time with round up
    const formattedWaitingTime = _formattedWaitingTime.split(' ').map((segment, index) => {
      if (index % 2 === 0) {
        return Math.ceil(parseFloat(segment)).toString();
      }

      return segment;
    }).join(' ');

    return t('Withdrawable in {{time}}', { replace: { time: formattedWaitingTime } });
  }
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
