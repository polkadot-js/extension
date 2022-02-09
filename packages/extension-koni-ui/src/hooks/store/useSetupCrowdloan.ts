// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect } from 'react';

import { CrowdloanJson } from '@polkadot/extension-base/background/KoniTypes';
import { subscribeCrowdloan } from '@polkadot/extension-koni-ui/messaging';
import { store } from '@polkadot/extension-koni-ui/stores';

function updateCrowdloan (crowdloan: CrowdloanJson): void {
  store.dispatch({ type: 'crowdloan/update', payload: crowdloan });
}

export default function useSetupCrowdloan (): void {
  useEffect((): void => {
    console.log('--- Setup redux: crowdloan');
    subscribeCrowdloan(null, updateCrowdloan)
      .then(updateCrowdloan)
      .catch(console.error);
  }, []);
}
