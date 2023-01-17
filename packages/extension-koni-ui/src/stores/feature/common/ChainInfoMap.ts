// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { _ChainInfo } from '@subwallet/chain-list/types';

const initialState = {
} as Record<string, _ChainInfo>;

const chainInfoMapSlice = createSlice({
  initialState,
  name: 'chainInfoMap',
  reducers: {
    update (state, action: PayloadAction<Record<string, _ChainInfo>>) {
      return action.payload;
    }
  }
});

export const { update } = chainInfoMapSlice.actions;
export default chainInfoMapSlice.reducer;
