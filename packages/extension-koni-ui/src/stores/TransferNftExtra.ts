// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { NftTransferExtra } from '@polkadot/extension-base/background/KoniTypes';

const initialState = {
  cronUpdate: false,
  forceUpdate: false
} as NftTransferExtra;

const transferNftExtraSlice = createSlice({
  initialState,
  name: 'transferNftExtra',
  reducers: {
    update (state, action: PayloadAction<NftTransferExtra>) {
      const payload = action.payload;

      state.cronUpdate = payload.cronUpdate;
      state.forceUpdate = payload.forceUpdate;
      state.selectedNftCollection = payload.selectedNftCollection;
      state.nftItems = payload.nftItems;
    }
  }
});

export const { update } = transferNftExtraSlice.actions;
export default transferNftExtraSlice.reducer;
