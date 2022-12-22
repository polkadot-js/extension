// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/extension-koni-base/services/chain-list/types';
import { subscribeAssetRegistry } from '@subwallet/extension-koni-ui/messaging';
import { store } from '@subwallet/extension-koni-ui/stores';
import { useEffect } from 'react';

function updateAssetRegistry (map: Record<string, _ChainAsset>): void {
  console.log('assetRegistry', map);
  // store.dispatch({ type: 'assetRegistry/update', payload: map });
}

export default function useSetupAssetRegistry (): void {
  useEffect((): void => {
    console.log('--- Setup redux: AssetRegistry');
    subscribeAssetRegistry(updateAssetRegistry)
      .then(updateAssetRegistry)
      .catch(console.error);
  }, []);
}
