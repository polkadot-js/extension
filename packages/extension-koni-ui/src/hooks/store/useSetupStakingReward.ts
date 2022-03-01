// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect } from 'react';

import { StakingRewardJson } from '@polkadot/extension-base/background/KoniTypes';
import { subscribeStakingReward } from '@polkadot/extension-koni-ui/messaging';
import { store } from '@polkadot/extension-koni-ui/stores';

function updateStakingReward (stakingRewardData: StakingRewardJson): void {
  store.dispatch({ type: 'stakingReward/update', payload: stakingRewardData });
}

export default function useSetupStakingReward (): void {
  useEffect((): void => {
    console.log('--- Setup redux: stakingReward');
    subscribeStakingReward(null, updateStakingReward)
      .then(updateStakingReward)
      .catch(console.error);
  }, []);
}
