// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { StakingRewardJson } from '@subwallet/extension-base/background/KoniTypes';
import { StakingRewardJson_ } from '@subwallet/extension-koni-ui/stores/types';

const initialState = {
  details: [],
  ready: false
} as StakingRewardJson_;

const stakingRewardSlice = createSlice({
  initialState,
  name: 'stakingReward',
  reducers: {
    update (state, action: PayloadAction<StakingRewardJson>) {
      const payload = action.payload;

      state.details = [...payload.slowInterval, ...payload.fastInterval];
      state.ready = payload.ready;
    }
  }
});

export const { update } = stakingRewardSlice.actions;
export default stakingRewardSlice.reducer;
