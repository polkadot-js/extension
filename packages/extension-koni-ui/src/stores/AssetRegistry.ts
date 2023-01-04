// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { _ChainAsset } from '@subwallet/chain/types';

const initialState: Record<string, _ChainAsset> = {};

const assetRegistrySlice = createSlice({
  initialState,
  name: 'assetRegistry',
  reducers: {
    update (state, action: PayloadAction<Record<string, _ChainAsset>>) {
      const { payload } = action;

      Object.assign(state, payload);
    }
  }
});

export const { update } = assetRegistrySlice.actions;
export default assetRegistrySlice.reducer;
