// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChainStakingMetadata, NominatorMetadata, StakingItem, StakingRewardItem, UnlockingStakeInfo } from '@subwallet/extension-base/background/KoniTypes';
import { ReduxStatus, StakingStore } from '@subwallet/extension-koni-ui/stores/types';

const initialState = {
  reduxStatus: ReduxStatus.INIT,
  stakingMap: [],
  stakeUnlockingMap: [],
  stakingRewardMap: [],
  chainStakingMetadataList: [],
  nominatorMetadataList: []
} as StakingStore;

const stakingSlice = createSlice({
  initialState,
  name: 'staking',
  reducers: {
    updateStaking (state, action: PayloadAction<StakingItem[]>) {
      const payload = action.payload;

      return {
        stakingMap: payload,
        stakeUnlockingMap: state.stakeUnlockingMap,
        stakingRewardMap: state.stakingRewardMap,
        chainStakingMetadataList: state.chainStakingMetadataList,
        nominatorMetadataList: state.nominatorMetadataList,
        reduxStatus: ReduxStatus.READY
      };
    },
    updateStakingReward (state, action: PayloadAction<StakingRewardItem[]>) {
      const payload = action.payload;

      return {
        stakingMap: state.stakingMap,
        stakeUnlockingMap: state.stakeUnlockingMap,
        stakingRewardMap: payload,
        chainStakingMetadataList: state.chainStakingMetadataList,
        nominatorMetadataList: state.nominatorMetadataList,
        reduxStatus: ReduxStatus.READY
      };
    },
    updateStakeUnlockingInfo (state, action: PayloadAction<UnlockingStakeInfo[]>) {
      const payload = action.payload;

      return {
        stakingMap: state.stakingMap,
        stakeUnlockingMap: payload,
        stakingRewardMap: state.stakingRewardMap,
        chainStakingMetadataList: state.chainStakingMetadataList,
        nominatorMetadataList: state.nominatorMetadataList,
        reduxStatus: ReduxStatus.READY
      };
    },
    updateChainStakingMetadata (state, action: PayloadAction<ChainStakingMetadata[]>) {
      const payload = action.payload;

      return {
        stakingMap: state.stakingMap,
        stakeUnlockingMap: state.stakeUnlockingMap,
        stakingRewardMap: state.stakingRewardMap,
        chainStakingMetadataList: payload,
        nominatorMetadataList: state.nominatorMetadataList,
        reduxStatus: ReduxStatus.READY
      };
    },
    updateNominatorMetadata (state, action: PayloadAction<NominatorMetadata[]>) {
      const payload = action.payload;

      return {
        stakingMap: state.stakingMap,
        stakeUnlockingMap: state.stakeUnlockingMap,
        stakingRewardMap: state.stakingRewardMap,
        chainStakingMetadataList: state.chainStakingMetadataList,
        nominatorMetadataList: payload,
        reduxStatus: ReduxStatus.READY
      };
    }
  }
});

export const { updateChainStakingMetadata, updateNominatorMetadata, updateStakeUnlockingInfo, updateStaking, updateStakingReward } = stakingSlice.actions;
export default stakingSlice.reducer;
