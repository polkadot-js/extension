// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { BondingParams } from '@subwallet/extension-koni-ui/stores/types';

const initialState = {
  selectedNetwork: '',
  selectedValidator: null,
  maxNominatorPerValidator: null
} as BondingParams;

const bondingParamsSlice = createSlice({
  initialState,
  name: 'bondingParams',
  reducers: {
    update (state, action: PayloadAction<BondingParams>) {
      const payload = action.payload;

      state.selectedNetwork = payload.selectedNetwork;
      state.selectedValidator = payload.selectedValidator;
      state.maxNominatorPerValidator = payload.maxNominatorPerValidator;
    }
  }
});

export const { update: updateBalance } = bondingParamsSlice.actions;
export default bondingParamsSlice.reducer;
