// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useSelector } from 'react-redux';

import { NftCollection } from '@polkadot/extension-base/background/KoniTypes';
import { ALL_ACCOUNT_KEY } from '@polkadot/extension-koni-base/constants';
import { NftType } from '@polkadot/extension-koni-ui/hooks/screen/home/types';
import { RootState } from '@polkadot/extension-koni-ui/stores';
import { NFT_GRID_SIZE } from '@polkadot/extension-koni-ui/util';

export default function useFetchNft (page: number, networkKey: string): NftType {
  const { nft: nftReducer, nftCollection: nftCollectionReducer } = useSelector((state: RootState) => state);
  // console.log('fetch nft from state', nftReducer);
  const nftCollection = nftCollectionReducer.nftCollection;
  const nftList = nftReducer?.nftList;
  const filteredNfts: NftCollection[] = [];
  let totalItems = nftList.length;
  let from = 0;
  let to = 0;

  console.log('nftList', nftList);
  console.log('nftCollection', nftCollection);

  const showAll = networkKey.toLowerCase() === ALL_ACCOUNT_KEY.toLowerCase();

  // TODO: handle nftCollection itemCOunt here

  if (!showAll) {
    totalItems = 0;
    nftCollection.forEach((collection) => {
      if (collection.chain && collection.chain === networkKey.toLowerCase()) {
        filteredNfts.push(collection);
      }
    });
  }

  if (!showAll && filteredNfts.length <= NFT_GRID_SIZE) {
    from = 0;
    to = filteredNfts.length;
  } else {
    from = (page - 1) * NFT_GRID_SIZE;
    to = from + NFT_GRID_SIZE;
  }

  return {
    nftList: showAll ? nftList.slice(from, to) : filteredNfts.slice(from, to),
    totalItems,
    totalCollection: showAll ? nftList.length : filteredNfts.length,
    loading: totalItems <= 0 // ready = not loading
  } as NftType;
}
