// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainState } from '@subwallet/extension-koni-base/services/chain-service/types';
import { subscribeChainStateMap } from '@subwallet/extension-koni-ui/messaging';
import { store } from '@subwallet/extension-koni-ui/stores';
import { useEffect } from 'react';

function updateChainStateMap (data: Record<string, _ChainState>): void {
  console.log('chainState', data);
  store.dispatch({ type: 'chainStateMap/update', payload: data });
}

export default function useSetupChainStateMap () {
  useEffect((): void => {
    console.log('--- Setup redux: chainStateMap');
    subscribeChainStateMap(updateChainStateMap)
      .then(updateChainStateMap)
      .catch(console.error);
  }, []);
}
