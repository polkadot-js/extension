// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { EvmTokenJson } from '@subwallet/extension-base/background/KoniTypes';

const initialState = {
  erc721: [],
  erc20: []
} as EvmTokenJson;

const evmTokenSlice = createSlice({
  initialState,
  name: 'evmToken',
  reducers: {
    update (state, action: PayloadAction<EvmTokenJson>) {
      const payload = action.payload;

      state.erc20 = payload.erc20;
      state.erc721 = payload.erc721;
    }
  }
});

export const { update } = evmTokenSlice.actions;
export default evmTokenSlice.reducer;
