// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { TransferNft } from '@polkadot/extension-koni-ui/stores/types';

const initialState = {
  nftItem: {}
} as TransferNft;

const transferNftSlice = createSlice({
  initialState,
  name: 'transferNft',
  reducers: {
    update (state, action: PayloadAction<TransferNft>) {
      const payload = action.payload;

      state.nftItem = payload.nftItem;
    }
  }
});

export const { update } = transferNftSlice.actions;
export default transferNftSlice.reducer;
