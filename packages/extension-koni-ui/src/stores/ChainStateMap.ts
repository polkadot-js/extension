// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { _ChainState } from '@subwallet/extension-koni-base/services/chain-service/types';

const initialState = {
} as Record<string, _ChainState>;

const networkMapSlice = createSlice({
  initialState,
  name: 'chainStateMap',
  reducers: {
    update (state, action: PayloadAction<Record<string, _ChainState>>) {
      return action.payload;
    }
  }
});

export const { update } = networkMapSlice.actions;
export default networkMapSlice.reducer;
