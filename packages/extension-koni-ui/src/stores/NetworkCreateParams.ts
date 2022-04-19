// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { NetworkCreateParams } from '@polkadot/extension-koni-ui/stores/types';

const initialState = {
  data: {}
} as NetworkCreateParams;

const networkCreateParamsSlice = createSlice({
  initialState,
  name: 'networkCreateParams',
  reducers: {
    update (state, action: PayloadAction<NetworkCreateParams>) {
      const payload = action.payload;

      state.data = payload.data;
    }
  }
});

export const { update } = networkCreateParamsSlice.actions;
export default networkCreateParamsSlice.reducer;
