// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainRegistry } from '@subwallet/extension-base/background/KoniTypes';
import { subscribeChainRegistry } from '@subwallet/extension-koni-ui/messaging';
import { store } from '@subwallet/extension-koni-ui/stores';
import { useEffect } from 'react';

function updateChainRegistry (map: Record<string, ChainRegistry>): void {
  console.log('ChainRegistry', map);
  store.dispatch({ type: 'chainRegistry/update', payload: map });
}

export default function useSetupChainRegistry (): void {
  useEffect((): void => {
    console.log('--- Setup redux: ChainRegistry');
    subscribeChainRegistry(updateChainRegistry)
      .then(updateChainRegistry)
      .catch(console.error);
  }, []);
}
