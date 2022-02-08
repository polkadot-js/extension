// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { NftJson } from '@polkadot/extension-base/background/KoniTypes';

const initialState = {
  total: 0,
  nftList: [],
  ready: false
} as NftJson;

const nftSlice = createSlice({
  initialState,
  name: 'nft',
  reducers: {
    update (state, action: PayloadAction<NftJson>) {
      const payload = action.payload;

      state.total = payload.total;
      state.nftList = payload.nftList;
      state.ready = true;
    }
  }
});

export const { update } = nftSlice.actions;
export default nftSlice.reducer;
