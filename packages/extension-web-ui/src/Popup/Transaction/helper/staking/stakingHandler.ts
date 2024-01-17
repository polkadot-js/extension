// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { StakingType, UnstakingStatus } from '@subwallet/extension-base/background/KoniTypes';
import { ALL_KEY } from '@subwallet/extension-web-ui/constants/common';
import { getBondingOptions, getNominationPoolOptions } from '@subwallet/extension-web-ui/messaging';
import { store } from '@subwallet/extension-web-ui/stores';
// @ts-ignore
import humanizeDuration from 'humanize-duration';
import { TFunction } from 'react-i18next';
import {_STAKING_CHAIN_GROUP} from "@subwallet/extension-base/services/earning-service/constants";

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

export function getWaitingTime (status: UnstakingStatus, t: TFunction, waitingTime?: number) {
  if (status === UnstakingStatus.CLAIMABLE) {
    return t('Available for withdrawal');
  } else {
    if (waitingTime === undefined) {
      return t('Waiting for withdrawal');
    }

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

    return t('Withdrawable in {{time}}', { replace: { time: formattedWaitingTime } });
  }
}

export const fetchChainValidator = (chain: string, unmount: boolean, setValidatorLoading: (value: boolean) => void, setForceFetchValidator: (value: boolean) => void) => {
  if (!unmount) {
    setValidatorLoading(true);
    getBondingOptions(chain, StakingType.NOMINATED)
      .then((result) => {
        store.dispatch({ type: 'bonding/updateChainValidators', payload: { chain, validators: result } });
      })
      .catch(console.error)
      .finally(() => {
        if (!unmount) {
          setValidatorLoading(false);
          setForceFetchValidator(false);
        }
      });
  }
};

export const fetchChainPool = (chain: string, unmount: boolean, setPoolLoading: (value: boolean) => void, setForceFetchValidator: (value: boolean) => void) => {
  if (!unmount && _STAKING_CHAIN_GROUP.nominationPool.includes(chain)) {
    setPoolLoading(true);
    getNominationPoolOptions(chain)
      .then((result) => {
        store.dispatch({ type: 'bonding/updateNominationPools', payload: { chain, pools: result } });
      })
      .catch(console.error)
      .finally(() => {
        if (!unmount) {
          setPoolLoading(false);
          setForceFetchValidator(false);
        }
      });
  }
};

export function fetchChainValidators (
  chain: string,
  stakingType: string,
  unmount: boolean,
  setPoolLoading: (value: boolean) => void,
  setValidatorLoading: (value: boolean) => void,
  setForceFetchValidator: (value: boolean) => void
) {
  if (stakingType === ALL_KEY) {
    fetchChainValidator(chain, unmount, setValidatorLoading, setForceFetchValidator);
    fetchChainPool(chain, unmount, setPoolLoading, setForceFetchValidator);
  } else if (stakingType === StakingType.NOMINATED) {
    fetchChainValidator(chain, unmount, setValidatorLoading, setForceFetchValidator);
  } else if (stakingType === StakingType.POOLED) {
    fetchChainPool(chain, unmount, setPoolLoading, setForceFetchValidator);
  }
}
