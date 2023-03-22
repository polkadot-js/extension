// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { StakingType } from '@subwallet/extension-base/background/KoniTypes';
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

export function fetchChainValidators (chain: string, stakingType: StakingType) {
  if (stakingType === StakingType.NOMINATED) {
    getBondingOptions(chain, stakingType)
      .then((result) => {
        store.dispatch({ type: 'bonding/updateChainValidators', payload: { chain, validators: result } });
      })
      .catch(console.error);
  } else {
    getNominationPoolOptions(chain)
      .then((result) => {
        store.dispatch({ type: 'bonding/updateNominationPools', payload: { chain, pools: result } });
      })
      .catch(console.error);
  }
}
