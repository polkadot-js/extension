// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { NftJson } from '@subwallet/extension-base/background/KoniTypes';

const initialState = {
  total: 0,
  nftList: []
} as NftJson;

const nftSlice = createSlice({
  initialState,
  name: 'nft',
  reducers: {
    update (state, action: PayloadAction<NftJson>) {
      const payload = action.payload;

      state.total = payload.total;
      state.nftList = payload.nftList;
    }
  }
});

export const { update } = nftSlice.actions;
export default nftSlice.reducer;
