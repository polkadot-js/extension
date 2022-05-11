// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { ChainRegistry } from '@subwallet/extension-base/background/KoniTypes';

const initialState: Record<string, ChainRegistry> = {};

const chainRegistrySlice = createSlice({
  initialState,
  name: 'chainRegistry',
  reducers: {
    update (state, action: PayloadAction<Record<string, ChainRegistry>>) {
      const { payload } = action;

      Object.assign(state, payload);
    }
  }
});

export const { update: updateChainRegistry } = chainRegistrySlice.actions;
export default chainRegistrySlice.reducer;
