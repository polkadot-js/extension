// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useSelector } from 'react-redux';

import { NftType } from '@polkadot/extension-koni-ui/hooks/screen/home/types';
import { RootState } from '@polkadot/extension-koni-ui/stores';
import { NFT_GRID_SIZE } from '@polkadot/extension-koni-ui/util';

export default function useFetchNft (page: number): NftType {
  const { nft: nftReducer } = useSelector((state: RootState) => state);

  // console.log('fetch nft from state', nftReducer);
  const nftList = nftReducer?.nftList;
  const from = (page - 1) * NFT_GRID_SIZE;
  const to = from + NFT_GRID_SIZE;

  return {
    nftList: nftList.slice(from, to),
    totalItems: nftReducer.total,
    totalCollection: nftReducer?.nftList.length,
    loading: !nftReducer.ready // ready = not loading
  } as NftType;
}
