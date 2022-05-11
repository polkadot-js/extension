// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { StakingJson } from '@subwallet/extension-base/background/KoniTypes';
import { subscribeStaking } from '@subwallet/extension-koni-ui/messaging';
import { store } from '@subwallet/extension-koni-ui/stores';
import { useEffect } from 'react';

function updateStaking (stakingData: StakingJson): void {
  store.dispatch({ type: 'staking/update', payload: stakingData });
}

export default function useSetupStaking (): void {
  useEffect((): void => {
    console.log('--- Setup redux: staking');
    subscribeStaking(null, updateStaking)
      .then(updateStaking)
      .catch(console.error);
  }, []);
}
