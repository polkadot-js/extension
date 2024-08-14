// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NftCollection, NftItem } from '@subwallet/extension-base/background/KoniTypes';

export interface INftCollectionDetail {
  collectionId: string
}

export interface INftItemDetail {
  collectionId: string,
  nftId: string
}

// might set perPage based on screen height
export const NFT_PER_PAGE = 4;

export const getNftsByCollection = (nftCollection: NftCollection, nftItems: NftItem[]) => {
  const nftList: NftItem[] = [];

  nftItems.forEach((nftItem) => {
    if (nftItem.collectionId === nftCollection.collectionId && nftItem.chain === nftCollection.chain) {
      nftList.push(nftItem);
    }
  });

  return nftList;
};
