// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect } from 'react';

import { NftCollection } from '@polkadot/extension-base/background/KoniTypes';
import { subscribeNftCollection } from '@polkadot/extension-koni-ui/messaging';
import { store } from '@polkadot/extension-koni-ui/stores';

function updateNftCollection (nftData: NftCollection[]): void {
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
