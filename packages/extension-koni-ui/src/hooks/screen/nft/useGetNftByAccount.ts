// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NftCollection, NftItem } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson } from '@subwallet/extension-base/background/types';
import { ALL_ACCOUNT_KEY } from '@subwallet/extension-base/constants';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import reformatAddress from '@subwallet/extension-koni-ui/util/reformatAddress';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

function filterNftByAccount (currentAccount: AccountJson | null, nftCollections: NftCollection[], nftItems: NftItem[]) {
  if (!currentAccount || currentAccount.address === ALL_ACCOUNT_KEY) {
    return { nftCollections, nftItems };
  }

  const currentAddress = reformatAddress(currentAccount.address, 0);
  const filteredNftItems: NftItem[] = [];
  const filteredNftCollections: NftCollection[] = [];

  const targetCollectionKeys: string[] = [];

  nftItems.forEach((nftItem) => {
    const formattedOwnerAddress = reformatAddress(nftItem.owner, 0);

    if (currentAddress === formattedOwnerAddress) {
      filteredNftItems.push(nftItem);
      const collectionKey = `${nftItem.chain}__${nftItem.collectionId}`;

      if (!targetCollectionKeys.includes(collectionKey)) {
        targetCollectionKeys.push(collectionKey);
      }
    }
  });

  nftCollections.forEach((nftCollection) => {
    const collectionKey = `${nftCollection.chain}__${nftCollection.collectionId}`;

    if (targetCollectionKeys.includes(collectionKey)) {
      filteredNftCollections.push(nftCollection);
    }
  });

  return { nftCollections: filteredNftCollections, nftItems: filteredNftItems };
}

export default function useGetNftByAccount () {
  const { nftCollections, nftItems } = useSelector((state: RootState) => state.nft);
  const currentAccount = useSelector((state: RootState) => state.accountState.currentAccount);

  return useMemo(() => {
    return filterNftByAccount(currentAccount, nftCollections, nftItems);
  }, [currentAccount, nftCollections, nftItems]);
}
