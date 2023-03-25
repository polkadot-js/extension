// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { StakingType } from '@subwallet/extension-base/background/KoniTypes';
import { ALL_KEY } from '@subwallet/extension-koni-ui/constants/commont';
import { getBondingOptions, getNominationPoolOptions } from '@subwallet/extension-koni-ui/messaging';
import { store } from '@subwallet/extension-koni-ui/stores';

export function getUnstakingPeriod (unstakingPeriod?: number) {
  if (unstakingPeriod) {
    const days = unstakingPeriod / 24;

    if (days < 1) {
      return 'Soon';
    } else {
      return `${days} days`;
    }
  }

  return '';
}

export function getWaitingTime (waitingTime?: number, untilWithdraw?: boolean) {
  const days = waitingTime ? Number(waitingTime / 24).toFixed(2) : 0;

  if (days < 1) {
    return 'Soon';
  } else {
    return `${days} ${untilWithdraw ? 'until withdraw' : 'next days'}`;
  }
}

const fetchChainValidator = (chain: string) => {
  getBondingOptions(chain, StakingType.NOMINATED)
    .then((result) => {
      store.dispatch({ type: 'bonding/updateChainValidators', payload: { chain, validators: result } });
    })
    .catch(console.error);
};

const fetchChainPool = (chain: string) => {
  getNominationPoolOptions(chain)
    .then((result) => {
      store.dispatch({ type: 'bonding/updateNominationPools', payload: { chain, pools: result } });
    })
    .catch(console.error);
};

export function fetchChainValidators (chain: string, stakingType: string) {
  if (stakingType === ALL_KEY) {
    fetchChainValidator(chain);
    fetchChainPool(chain);
  } else if (stakingType === StakingType.NOMINATED) {
    fetchChainValidator(chain);
  } else if (stakingType === StakingType.POOLED) {
    fetchChainPool(chain);
  }
}
