// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { NetworkJson } from '@polkadot/extension-base/background/KoniTypes';

const initialState = {} as Record<string, NetworkJson>;

const networkMapSlice = createSlice({
  initialState,
  name: 'networkMap',
  reducers: {
    update (state, action: PayloadAction<Record<string, NetworkJson>>) {
      state = action.payload;
    }
  }
});

export const { update } = networkMapSlice.actions;
export default networkMapSlice.reducer;
