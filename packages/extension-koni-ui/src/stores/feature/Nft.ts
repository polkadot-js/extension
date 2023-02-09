// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { NftCollection, NftItem } from '@subwallet/extension-base/background/KoniTypes';
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
    updateNftItems (state, action: PayloadAction<NftItem[]>) {
      const payload = action.payload;

      return {
        reduxStatus: ReduxStatus.READY,
        nftItems: payload,
        nftCollections: state.nftCollections
      };
    },
    updateNftCollections (state, action: PayloadAction<NftCollection[]>) {
      const payload = action.payload;

      return {
        reduxStatus: ReduxStatus.READY,
        nftItems: state.nftItems,
        nftCollections: payload
      };
    }
  }
});

export const { updateNftCollections, updateNftItems } = nftSlice.actions;
export default nftSlice.reducer;
