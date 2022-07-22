// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AuthUrls } from '@subwallet/extension-base/background/handlers/State';
import { subscribeAuthUrl } from '@subwallet/extension-koni-ui/messaging';
import { store } from '@subwallet/extension-koni-ui/stores';
import { useEffect } from 'react';

function updateAuthUrl (balanceData: AuthUrls): void {
  store.dispatch({ type: 'authUrl/update', payload: balanceData });
}

export default function useSetupAuthUrl (): void {
  useEffect((): void => {
    console.log('--- Setup redux: authUrl');
    subscribeAuthUrl(updateAuthUrl)
      .then(updateAuthUrl)
      .catch(console.error);
  }, []);
}
