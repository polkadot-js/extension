// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useSelector } from 'react-redux';

import { NftCollection } from '@polkadot/extension-base/background/KoniTypes';
import { ALL_ACCOUNT_KEY } from '@polkadot/extension-koni-base/constants';
import { NftType } from '@polkadot/extension-koni-ui/hooks/screen/home/types';
import { RootState } from '@polkadot/extension-koni-ui/stores';
import { NFT_GRID_SIZE } from '@polkadot/extension-koni-ui/util';

export default function useFetchNft (page: number, networkKey: string): NftType {
  const { nft: nftReducer } = useSelector((state: RootState) => state);

  // console.log('fetch nft from state', nftReducer);
  const nftList = nftReducer?.nftList;
  const filteredNfts: NftCollection[] = [];
  let totalItems = nftReducer.total;

  const showAll = networkKey.toLowerCase() === ALL_ACCOUNT_KEY.toLowerCase();

  if (!showAll) {
    totalItems = 0;
    nftList.forEach((nftCollection) => {
      if (nftCollection.chain && nftCollection.chain === networkKey.toLowerCase()) {
        filteredNfts.push(nftCollection);
        // @ts-ignore
        totalItems += nftCollection.nftItems.length;
      }
    });
  }

  const from = (page - 1) * NFT_GRID_SIZE;
  const to = from + NFT_GRID_SIZE;

  return {
    nftList: showAll ? nftList.slice(from, to) : filteredNfts.slice(from, to),
    totalItems,
    totalCollection: showAll ? nftList.length : filteredNfts.length,
    loading: !nftReducer.ready // ready = not loading
  } as NftType;
}
