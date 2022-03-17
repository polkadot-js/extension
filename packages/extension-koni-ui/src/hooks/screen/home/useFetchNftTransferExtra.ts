// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useSelector } from 'react-redux';

import { NftCollection, NftTransferExtra } from '@polkadot/extension-base/background/KoniTypes';
import { setNftTransfer } from '@polkadot/extension-koni-ui/messaging';
import { RootState } from '@polkadot/extension-koni-ui/stores';

function updateNftTransfer (nftData: NftTransferExtra): void {
  setNftTransfer(nftData).catch(console.error);
}

export default function useFetchNftExtra (isShown: boolean): NftCollection | undefined {
  const { transferNftExtra } = useSelector((state: RootState) => state);

  if (!isShown) {
    const selectedCollection: NftCollection | undefined = transferNftExtra.selectedNftCollection;

    updateNftTransfer({
      cronUpdate: transferNftExtra.cronUpdate,
      forceUpdate: transferNftExtra.forceUpdate
    } as NftTransferExtra); // remove selectedNftCollection after viewing

    return selectedCollection;
  }

  return undefined;
}
