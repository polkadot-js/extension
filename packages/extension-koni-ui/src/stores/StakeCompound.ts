// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { StakeCompoundParams } from '@subwallet/extension-koni-ui/stores/types';

const initialState = {
} as StakeCompoundParams;

const stakeCompoundSlice = createSlice({
  initialState,
  name: 'stakeCompoundParams',
  reducers: {
    update (state, action: PayloadAction<StakeCompoundParams>) {
      const payload = action.payload;

      state.selectedAccount = payload.selectedAccount;
      state.selectedNetwork = payload.selectedNetwork;
    }
  }
});

export const { update } = stakeCompoundSlice.actions;
export default stakeCompoundSlice.reducer;
