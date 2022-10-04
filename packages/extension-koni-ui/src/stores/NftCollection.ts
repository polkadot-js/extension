// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { NftCollection, NftCollectionJson } from '@subwallet/extension-base/background/KoniTypes';

const initialState = {
  ready: false,
  nftCollectionList: []
} as NftCollectionJson;

const nftCollectionSlice = createSlice({
  initialState,
  name: 'nftCollection',
  reducers: {
    update (state, action: PayloadAction<NftCollection[]>) {
      const payload = action.payload;

      state.nftCollectionList = payload;
      state.ready = true;
    }
  }
});

export const { update } = nftCollectionSlice.actions;
export default nftCollectionSlice.reducer;
