// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { StakingRewardJson } from '@subwallet/extension-base/background/KoniTypes';

const initialState = {
  details: {},
  ready: false
} as StakingRewardJson;

const stakingRewardSlice = createSlice({
  initialState,
  name: 'stakingReward',
  reducers: {
    update (state, action: PayloadAction<StakingRewardJson>) {
      const payload = action.payload;

      state.details = payload.details;
      state.ready = payload.ready;
    }
  }
});

export const { update } = stakingRewardSlice.actions;
export default stakingRewardSlice.reducer;
