// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NetworkJson } from '@subwallet/extension-base/background/KoniTypes';
import { subscribeNetworkMap } from '@subwallet/extension-koni-ui/messaging';
import { store } from '@subwallet/extension-koni-ui/stores';
import { useEffect } from 'react';

function updateNetworkMap (data: Record<string, NetworkJson>): void {
  store.dispatch({ type: 'networkMap/update', payload: data });
}

export default function useSetupNetworkMap (): void {
  useEffect((): void => {
    console.log('--- Setup redux: networkMap');
    subscribeNetworkMap(updateNetworkMap)
      .then(updateNetworkMap)
      .catch(console.error);
  }, []);
}
