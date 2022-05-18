// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TransferNftParams } from '@subwallet/extension-koni-ui/stores/types';

const initialState = {
  nftItem: {}
} as TransferNftParams;

const transferNftParamsSlice = createSlice({
  initialState,
  name: 'transferNftParams',
  reducers: {
    update (state, action: PayloadAction<TransferNftParams>) {
      const payload = action.payload;

      state.nftItem = payload.nftItem;
      state.collectionImage = payload.collectionImage;
      state.collectionId = payload.collectionId;
    }
  }
});

export const { update } = transferNftParamsSlice.actions;
export default transferNftParamsSlice.reducer;
