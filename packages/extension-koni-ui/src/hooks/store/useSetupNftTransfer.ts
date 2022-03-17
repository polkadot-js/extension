// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect } from 'react';

import { NftTransferExtra } from '@polkadot/extension-base/background/KoniTypes';
import { subscribeNftTransfer } from '@polkadot/extension-koni-ui/messaging';
import { store } from '@polkadot/extension-koni-ui/stores';

function updateNftTransfer (nftData: NftTransferExtra): void {
  store.dispatch({ type: 'transferNftExtra/update', payload: nftData });
}

export default function useSetupNftTransfer (): void {
  useEffect((): void => {
    console.log('--- Setup redux: nft transfer');
    subscribeNftTransfer(updateNftTransfer)
      .then(updateNftTransfer)
      .catch(console.error);
  }, []);
}
