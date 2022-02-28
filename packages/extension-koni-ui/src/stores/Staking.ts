// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { StakingJson } from '@polkadot/extension-base/background/KoniTypes';

const initialState = {
  details: {}
} as StakingJson;

const stakingSlice = createSlice({
  initialState,
  name: 'staking',
  reducers: {
    update (state, action: PayloadAction<StakingJson>) {
      const payload = action.payload;

      state.details = payload.details;
    }
  }
});

export const { update } = stakingSlice.actions;
export default stakingSlice.reducer;
