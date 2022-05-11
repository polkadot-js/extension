// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NftTransferExtra } from '@subwallet/extension-base/background/KoniTypes';
import { subscribeNftTransfer } from '@subwallet/extension-koni-ui/messaging';
import { store } from '@subwallet/extension-koni-ui/stores';
import { useEffect } from 'react';

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
