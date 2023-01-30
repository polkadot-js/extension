// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { NftCollectionJson, NftJson } from '@subwallet/extension-base/background/KoniTypes';
import { NftStore, ReduxStatus } from '@subwallet/extension-koni-ui/stores/types';

const initialState = {
  nftItems: [],
  nftCollections: [],
  reduxStatus: ReduxStatus.INIT
} as NftStore;

const nftSlice = createSlice({
  initialState,
  name: 'nft',
  reducers: {
    updateNftItems (state, action: PayloadAction<NftJson>) {
      const payload = action.payload;

      return {
        reduxStatus: ReduxStatus.READY,
        nftItems: payload.nftList,
        nftCollections: state.nftCollections
      };
    },
    updateNftCollections (state, action: PayloadAction<NftCollectionJson>) {
      const payload = action.payload;

      return {
        reduxStatus: ReduxStatus.READY,
        nftItems: state.nftCollections,
        nftCollections: payload.nftCollectionList
      };
    }
  }
});

export const { updateNftCollections, updateNftItems } = nftSlice.actions;
export default nftSlice.reducer;
