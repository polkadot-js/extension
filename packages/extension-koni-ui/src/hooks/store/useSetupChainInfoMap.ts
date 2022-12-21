// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/extension-koni-base/services/chain-list/types';
import { subscribeChainInfoMap } from '@subwallet/extension-koni-ui/messaging';
import { store } from '@subwallet/extension-koni-ui/stores';
import { useEffect } from 'react';

function updateChainInfoMap (data: Record<string, _ChainInfo>): void {
  console.log('data', data);
  store.dispatch({ type: 'chainInfoMap/update', payload: data });
}

export default function useSetupChainInfoMap () {
  useEffect((): void => {
    console.log('--- Setup redux: chainInfoMap');
    subscribeChainInfoMap(updateChainInfoMap)
      .then(updateChainInfoMap)
      .catch(console.error);
  }, []);
}
