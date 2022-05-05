// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { EvmTokenJson } from '@polkadot/extension-koni-ui/stores/types';

const initialState = {
  evmTokenList: []
} as EvmTokenJson;

const evmTokenSlice = createSlice({
  initialState,
  name: 'evmToken',
  reducers: {
    update (state, action: PayloadAction<EvmTokenJson>) {
      const payload = action.payload;

      state.evmTokenList = payload.evmTokenList;
    }
  }
});

export const { update } = evmTokenSlice.actions;
export default evmTokenSlice.reducer;
