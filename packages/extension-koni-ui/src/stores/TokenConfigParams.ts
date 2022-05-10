// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { TokenConfigParams } from '@polkadot/extension-koni-ui/stores/types';

const initialState = {
  data: {}
} as TokenConfigParams;

const tokenConfigSlice = createSlice({
  initialState,
  name: 'tokenConfigParams',
  reducers: {
    update (state, action: PayloadAction<TokenConfigParams>) {
      const payload = action.payload;

      state.data = payload.data;
    }
  }
});

export const { update } = tokenConfigSlice.actions;
export default tokenConfigSlice.reducer;
