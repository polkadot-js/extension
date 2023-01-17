// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CustomTokenJson } from '@subwallet/extension-base/background/KoniTypes';

const initialState = {
  erc721: [],
  erc20: [],
  psp22: [],
  psp34: []
} as CustomTokenJson;

const customTokenSlice = createSlice({
  initialState,
  name: 'customToken',
  reducers: {
    update (state, action: PayloadAction<CustomTokenJson>) {
      const payload = action.payload;

      state.erc20 = payload.erc20;
      state.erc721 = payload.erc721;
      state.psp22 = payload.psp22;
      state.psp34 = payload.psp34;
    }
  }
});

export const { update } = customTokenSlice.actions;
export default customTokenSlice.reducer;
