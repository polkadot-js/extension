// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { StakeUnlockingJson } from '@subwallet/extension-base/background/KoniTypes';
import { subscribeStakeUnlockingInfo } from '@subwallet/extension-koni-ui/messaging';
import { store } from '@subwallet/extension-koni-ui/stores';
import { useEffect } from 'react';

function updateStakeUnlockingInfo (data: StakeUnlockingJson) {
  store.dispatch({ type: 'stakeUnlockingInfo/update', payload: data });
}

export default function useSetupStakeUnlockingInfo () {
  useEffect((): void => {
    console.log('--- Setup redux: stakeUnlockingInfo');
    subscribeStakeUnlockingInfo(updateStakeUnlockingInfo)
      .then(updateStakeUnlockingInfo)
      .catch(console.error);
  }, []);
}
