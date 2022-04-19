// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect } from 'react';

import { ChainRegistry } from '@polkadot/extension-base/background/KoniTypes';
import { subscribeChainRegistry } from '@polkadot/extension-koni-ui/messaging';
import { store } from '@polkadot/extension-koni-ui/stores';

function updateChainRegistry (map: Record<string, ChainRegistry>): void {
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
