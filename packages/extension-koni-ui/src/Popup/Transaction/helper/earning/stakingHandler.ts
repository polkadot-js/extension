// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { UnstakingStatus } from '@subwallet/extension-base/types';
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
    const formattedWaitingTime = humanizeDuration(waitingTimeInMs, {
      units: ['d', 'h'],
      round: true,
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

    return t('Withdraw in {{time}}', { replace: { time: formattedWaitingTime } });
  }
}
