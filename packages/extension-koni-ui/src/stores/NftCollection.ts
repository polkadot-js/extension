// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { NftCollection } from '@polkadot/extension-base/background/KoniTypes';
import { NftCollectionType } from '@polkadot/extension-koni-ui/stores/types';

const initialState = {
  nftCollection: []
} as NftCollectionType;

const nftCollectionSlice = createSlice({
  initialState,
  name: 'nftCollection',
  reducers: {
    update (state, action: PayloadAction<NftCollection[]>) {
      state.nftCollection = action.payload;
    }
  }
});

export const { update } = nftCollectionSlice.actions;
export default nftCollectionSlice.reducer;
