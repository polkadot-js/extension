// [object Object]
// SPDX-License-Identifier: Apache-2.0

import { useSelector } from 'react-redux';

import { NftType } from '@polkadot/extension-koni-ui/hooks/screen/home/types';
import { RootState } from '@polkadot/extension-koni-ui/stores';

export default function useFetchNft (): NftType {
  const { nft: nftReducer } = useSelector((state: RootState) => state);

  // console.log('fetch nft from state');

  return {
    nftList: nftReducer?.nftList,
    nftJson: nftReducer,
    totalCollection: nftReducer?.nftList.length,
    loading: !nftReducer.ready // ready = not loading
  } as NftType;
}
