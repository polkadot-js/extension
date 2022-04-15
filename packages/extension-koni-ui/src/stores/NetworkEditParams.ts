// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { NetworkEditParams } from '@polkadot/extension-koni-ui/stores/types';

const initialState = {
  data: {},
  mode: 'edit'
} as NetworkEditParams;

const networkEditParamsSlice = createSlice({
  initialState,
  name: 'networkEditParams',
  reducers: {
    update (state, action: PayloadAction<NetworkEditParams>) {
      const payload = action.payload;

      state.data = payload.data;
      state.mode = payload.mode;
    }
  }
});

export const { update } = networkEditParamsSlice.actions;
export default networkEditParamsSlice.reducer;
