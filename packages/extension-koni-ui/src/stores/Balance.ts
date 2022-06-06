// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit/dist';
import { BalanceJson } from '@subwallet/extension-base/background/KoniTypes';

const initialState = {
  details: {}
} as BalanceJson;

const balanceSlice = createSlice({
  initialState,
  name: 'balance',
  reducers: {
    update (state, action: PayloadAction<BalanceJson>) {
      const payload = action.payload;

      state.details = { ...state.details, ...payload.details };
    }
  }
});

export const { update: updateBalance } = balanceSlice.actions;
export default balanceSlice.reducer;
