// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect } from 'react';

import { NftJson } from '@polkadot/extension-base/background/KoniTypes';
import { subscribeNft } from '@polkadot/extension-koni-ui/messaging';
import { store } from '@polkadot/extension-koni-ui/stores';

function updateNft (nftData: NftJson): void {
  console.log('nft state', nftData);
  store.dispatch({ type: 'nft/update', payload: nftData });
}

export default function useSetupNft (): void {
  useEffect((): void => {
    console.log('--- Setup redux: nft');
    subscribeNft(null, updateNft)
      .then(updateNft)
      .catch(console.error);
  }, []);
}
