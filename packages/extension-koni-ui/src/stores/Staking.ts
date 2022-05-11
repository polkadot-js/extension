// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { StakingJson } from '@subwallet/extension-base/background/KoniTypes';

const initialState = {
  ready: false,
  details: {}
} as StakingJson;

const stakingSlice = createSlice({
  initialState,
  name: 'staking',
  reducers: {
    update (state, action: PayloadAction<StakingJson>) {
      const payload = action.payload;

      state.details = payload.details;
      state.ready = payload.ready;
    }
  }
});

export const { update } = stakingSlice.actions;
export default stakingSlice.reducer;
