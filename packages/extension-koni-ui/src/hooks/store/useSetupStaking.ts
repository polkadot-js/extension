// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect } from 'react';

import { StakingJson } from '@polkadot/extension-base/background/KoniTypes';
import { subscribeStaking } from '@polkadot/extension-koni-ui/messaging';
import { store } from '@polkadot/extension-koni-ui/stores';

function updateStaking (stakingData: StakingJson): void {
  store.dispatch({ type: 'staking', payload: stakingData });
}

export default function useSetupStaking (): void {
  useEffect((): void => {
    console.log('--- Setup redux: staking');
    // subscribeStaking(null, updateStaking)
    //   .then(updateStaking)
    //   .catch(console.error);
  }, []);
}
