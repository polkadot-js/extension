// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect } from 'react';

import { EvmTokenJson } from '@subwallet/extension-base/background/KoniTypes';
import { subscribeEvmToken } from '@subwallet/extension-koni-ui/messaging';
import { store } from '@subwallet/extension-koni-ui/stores';

function updateEvmTokenState (data: EvmTokenJson): void {
  store.dispatch({ type: 'evmToken/update', payload: data });
}

export default function useSetupEvmToken (): void {
  useEffect((): void => {
    console.log('--- Setup redux: evmToken');
    subscribeEvmToken(updateEvmTokenState)
      .then(updateEvmTokenState)
      .catch(console.error);
  }, []);
}
