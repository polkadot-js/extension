// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit/dist';
import { EarningRewardHistoryItem, EarningRewardItem, ResponseGetYieldPoolTargets, YieldPoolInfo, YieldPositionInfo } from '@subwallet/extension-base/types';
import { EarningStore, ReduxStatus } from '@subwallet/extension-web-ui/stores/types';

const initialState: EarningStore = {
  poolInfoMap: {},
  yieldPositions: [],
  reduxStatus: ReduxStatus.INIT,
  earningRewards: [],
  rewardHistories: [],
  minAmountPercentMap: {},
  poolTargetsMap: {}
};

const earningSlice = createSlice({
  initialState,
  name: 'earning',
  reducers: {
    updateYieldPoolInfo (state, action: PayloadAction<YieldPoolInfo[]>): EarningStore {
      const poolInfo: Record<string, YieldPoolInfo> = {};

      action.payload.forEach((yieldPool) => {
        poolInfo[yieldPool.slug] = yieldPool;
      });

      return {
        ...state,
        poolInfoMap: poolInfo,
        reduxStatus: ReduxStatus.READY
      };
    },
    updateYieldPositionInfo (state, action: PayloadAction<YieldPositionInfo[]>): EarningStore {
      return {
        ...state,
        yieldPositions: action.payload,
        reduxStatus: ReduxStatus.READY
      };
    },
    updateYieldReward (state, action: PayloadAction<EarningRewardItem[]>): EarningStore {
      return {
        ...state,
        earningRewards: action.payload,
        reduxStatus: ReduxStatus.READY
      };
    },
    updateRewardHistory (state, action: PayloadAction<EarningRewardHistoryItem[]>): EarningStore {
      return {
        ...state,
        rewardHistories: action.payload,
        reduxStatus: ReduxStatus.READY
      };
    },
    updateMinAmountPercent (state, action: PayloadAction<Record<string, number>>): EarningStore {
      return {
        ...state,
        minAmountPercentMap: action.payload,
        reduxStatus: ReduxStatus.READY
      };
    },
    updatePoolTargets (state, action: PayloadAction<ResponseGetYieldPoolTargets>): EarningStore {
      const payload = action.payload;

      const result = {
        ...state.poolTargetsMap,
        [payload.slug]: payload.targets
      };

      return {
        ...state,
        poolTargetsMap: result,
        reduxStatus: ReduxStatus.READY
      };
    }
  }
});

export const { updateMinAmountPercent,
  updatePoolTargets,
  updateRewardHistory,
  updateYieldPoolInfo,
  updateYieldPositionInfo,
  updateYieldReward } = earningSlice.actions;
export default earningSlice.reducer;
