// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { StakingRewardJson } from '@subwallet/extension-base/background/KoniTypes';
import { subscribeStakingReward } from '@subwallet/extension-koni-ui/messaging';
import { store } from '@subwallet/extension-koni-ui/stores';
import { useEffect } from 'react';

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
