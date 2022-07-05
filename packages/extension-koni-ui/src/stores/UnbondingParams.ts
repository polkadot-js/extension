// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UnbondingParams } from '@subwallet/extension-koni-ui/stores/types';

const initialState = {
  selectedNetwork: null,
  bondedAmount: null,
  selectedAccount: null
} as UnbondingParams;

const unbondingParamsSlice = createSlice({
  initialState,
  name: 'unbondingParams',
  reducers: {
    update (state, action: PayloadAction<UnbondingParams>) {
      const payload = action.payload;

      state.selectedNetwork = payload.selectedNetwork;
      state.bondedAmount = payload.bondedAmount;
      state.delegations = payload.delegations;
      state.selectedAccount = payload.selectedAccount;
    }
  }
});

export const { update: updateBalance } = unbondingParamsSlice.actions;
export default unbondingParamsSlice.reducer;
