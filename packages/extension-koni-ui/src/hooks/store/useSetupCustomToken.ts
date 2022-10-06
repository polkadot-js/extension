// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CustomTokenJson } from '@subwallet/extension-base/background/KoniTypes';
import { subscribeCustomToken } from '@subwallet/extension-koni-ui/messaging';
import { store } from '@subwallet/extension-koni-ui/stores';
import { useEffect } from 'react';

function updateCustomTokenState (data: CustomTokenJson): void {
  store.dispatch({ type: 'customToken/update', payload: data });
}

export default function useSetupCustomToken (): void {
  useEffect((): void => {
    console.log('--- Setup redux: customToken');
    subscribeCustomToken(updateCustomTokenState)
      .then(updateCustomTokenState)
      .catch(console.error);
  }, []);
}
