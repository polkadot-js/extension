// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { StakingItem, StakingRewardItem, UnlockingStakeInfo } from '@subwallet/extension-base/background/KoniTypes';
import { ReduxStatus, StakingStore } from '@subwallet/extension-koni-ui/stores/types';

const initialState = {
  reduxStatus: ReduxStatus.INIT,
  stakingMap: {},
  stakeUnlockingMap: {},
  stakingRewardMap: {}
} as StakingStore;

const stakingSlice = createSlice({
  initialState,
  name: 'staking',
  reducers: {
    updateStaking (state, action: PayloadAction<Record<string, StakingItem>>) {
      const payload = action.payload;

      return {
        stakingMap: payload,
        stakeUnlockingMap: state.stakeUnlockingMap,
        stakingRewardMap: state.stakingRewardMap,
        reduxStatus: ReduxStatus.READY
      };
    },
    updateStakingReward (state, action: PayloadAction<Record<string, StakingRewardItem>>) {
      const payload = action.payload;

      return {
        stakingMap: state.stakingMap,
        stakeUnlockingMap: state.stakeUnlockingMap,
        stakingRewardMap: payload,
        reduxStatus: ReduxStatus.READY
      };
    },
    updateStakeUnlockingInfo (state, action: PayloadAction<Record<string, UnlockingStakeInfo>>) {
      const payload = action.payload;

      return {
        stakingMap: state.stakingMap,
        stakeUnlockingMap: payload,
        stakingRewardMap: state.stakingRewardMap,
        reduxStatus: ReduxStatus.READY
      };
    }
  }
});

export const { updateStakeUnlockingInfo, updateStaking, updateStakingReward } = stakingSlice.actions;
export default stakingSlice.reducer;
