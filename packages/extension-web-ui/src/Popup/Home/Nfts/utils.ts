// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NftCollection, NftItem } from '@subwallet/extension-base/background/KoniTypes';

export interface INftCollectionDetail {
  collectionInfo: NftCollection,
  nftList: NftItem[]
}

export interface INftItemDetail {
  collectionInfo: NftCollection,
  nftItem: NftItem
}

// might set perPage based on screen height
export const NFT_PER_PAGE = 4;
