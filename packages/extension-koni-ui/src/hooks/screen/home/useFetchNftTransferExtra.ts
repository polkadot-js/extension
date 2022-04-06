// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useSelector } from 'react-redux';

import { NftTransferExtra } from '@polkadot/extension-base/background/KoniTypes';
import { setNftTransfer } from '@polkadot/extension-koni-ui/messaging';
import { _NftCollection } from '@polkadot/extension-koni-ui/Popup/Home/Nfts/types';
import { RootState } from '@polkadot/extension-koni-ui/stores';

function updateNftTransfer (nftData: NftTransferExtra): void {
  setNftTransfer(nftData).catch(console.error);
}

export default function useFetchNftExtra (isShown: boolean, updateShown: (val: boolean) => void): _NftCollection | undefined {
  const { transferNftExtra } = useSelector((state: RootState) => state);

  if (transferNftExtra.cronUpdate && transferNftExtra.forceUpdate) {
    updateShown(true);

    return undefined;
  }

  if (!isShown && transferNftExtra.selectedNftCollection) {
    const rawCollection = transferNftExtra.selectedNftCollection;
    const nftItems = transferNftExtra.nftItems;

    updateNftTransfer({
      cronUpdate: transferNftExtra.cronUpdate,
      forceUpdate: transferNftExtra.forceUpdate
    } as NftTransferExtra); // remove selectedNftCollection after viewing

    if (rawCollection) {
      return {
        collectionId: rawCollection.collectionId,
        collectionName: rawCollection.collectionName,
        image: rawCollection.image,
        chain: rawCollection.chain,
        nftItems
      } as _NftCollection;
    }

    return undefined;
  }

  return undefined;
}
