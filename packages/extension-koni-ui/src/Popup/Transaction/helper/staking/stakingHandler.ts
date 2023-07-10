// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { StakingType } from '@subwallet/extension-base/background/KoniTypes';
import { _STAKING_CHAIN_GROUP } from '@subwallet/extension-base/services/chain-service/constants';
import { ALL_KEY } from '@subwallet/extension-koni-ui/constants/common';
import { getBondingOptions, getNominationPoolOptions } from '@subwallet/extension-koni-ui/messaging';
import { store } from '@subwallet/extension-koni-ui/stores';
import moment from 'moment';

export function getUnstakingPeriod (unstakingPeriod?: number) {
  if (unstakingPeriod) {
    const days = unstakingPeriod / 24;

    if (days < 1) {
      return `${unstakingPeriod} hours`;
    } else {
      return `${days} days`;
    }
  }

  return '';
}

export function getWaitingTime (waitingTime: number) {
  if (waitingTime < 1) {
    if (waitingTime >= 0) {
      return 'Withdrawable within a day';
    } else {
      return 'Available for withdrawal';
    }
  } else {
    const days = moment.duration(waitingTime, 'hours').humanize();

    return `Withdraw in ${days}`;
  }
}

const fetchChainValidator = (chain: string, unmount: boolean, setValidatorLoading: (value: boolean) => void) => {
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
        }
      });
  }
};

const fetchChainPool = (chain: string, unmount: boolean, setPoolLoading: (value: boolean) => void) => {
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
        }
      });
  }
};

export function fetchChainValidators (
  chain: string,
  stakingType: string,
  unmount: boolean,
  setPoolLoading: (value: boolean) => void,
  setValidatorLoading: (value: boolean) => void
) {
  if (stakingType === ALL_KEY) {
    fetchChainValidator(chain, unmount, setValidatorLoading);
    fetchChainPool(chain, unmount, setPoolLoading);
  } else if (stakingType === StakingType.NOMINATED) {
    fetchChainValidator(chain, unmount, setValidatorLoading);
  } else if (stakingType === StakingType.POOLED) {
    fetchChainPool(chain, unmount, setPoolLoading);
  }
}
