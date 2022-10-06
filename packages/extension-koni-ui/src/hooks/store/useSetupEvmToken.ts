// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CustomTokenJson } from '@subwallet/extension-base/background/KoniTypes';
import { subscribeEvmToken } from '@subwallet/extension-koni-ui/messaging';
import { store } from '@subwallet/extension-koni-ui/stores';
import { useEffect } from 'react';

function updateEvmTokenState (data: CustomTokenJson): void {
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
