// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect } from 'react';

import { NftJson } from '@subwallet/extension-base/background/KoniTypes';
import { subscribeNft } from '@subwallet/extension-koni-ui/messaging';
import { store } from '@subwallet/extension-koni-ui/stores';

function updateNft (nftData: NftJson): void {
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
