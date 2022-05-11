// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CrowdloanJson } from '@subwallet/extension-base/background/KoniTypes';
import { subscribeCrowdloan } from '@subwallet/extension-koni-ui/messaging';
import { store } from '@subwallet/extension-koni-ui/stores';
import { useEffect } from 'react';

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
