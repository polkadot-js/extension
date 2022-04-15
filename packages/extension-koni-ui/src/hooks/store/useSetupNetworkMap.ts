// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect } from 'react';

import { NetworkJson } from '@polkadot/extension-base/background/KoniTypes';
import { subscribeNetworkMap } from '@polkadot/extension-koni-ui/messaging';
import { store } from '@polkadot/extension-koni-ui/stores';

function updateNetworkMap (data: Record<string, NetworkJson>): void {
  console.log(data);
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
