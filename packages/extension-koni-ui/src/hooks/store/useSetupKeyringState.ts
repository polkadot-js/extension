// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { KeyringState } from '@subwallet/extension-base/background/KoniTypes';
import { keyringStateSubscribe } from '@subwallet/extension-koni-ui/messaging';
import { store } from '@subwallet/extension-koni-ui/stores';
import { useEffect } from 'react';

function updateKeyringState (data: KeyringState): void {
  store.dispatch({ type: 'keyringState/update', payload: data });
}

export default function useSetupKeyringState (): void {
  useEffect((): void => {
    console.log('--- Setup redux: keyringState');
    keyringStateSubscribe(updateKeyringState)
      .then(updateKeyringState)
      .catch(console.error);
  }, []);
}
