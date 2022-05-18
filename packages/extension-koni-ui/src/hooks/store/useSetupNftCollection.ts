// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NftCollectionJson } from '@subwallet/extension-base/background/KoniTypes';
import { subscribeNftCollection } from '@subwallet/extension-koni-ui/messaging';
import { store } from '@subwallet/extension-koni-ui/stores';
import { useEffect } from 'react';

function updateNftCollection (nftData: NftCollectionJson): void {
  store.dispatch({ type: 'nftCollection/update', payload: nftData });
}

export default function useSetupNftCollection (): void {
  useEffect((): void => {
    console.log('--- Setup redux: nft collection');
    subscribeNftCollection(updateNftCollection)
      .then(updateNftCollection)
      .catch(console.error);
  }, []);
}
