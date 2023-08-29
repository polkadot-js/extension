// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit/dist';
import { YieldPoolInfo } from '@subwallet/extension-base/background/KoniTypes';
import { ReduxStatus, YieldPoolStore } from '@subwallet/extension-koni-ui/stores/types';

const initialState = {
  poolInfo: {},
  reduxStatus: ReduxStatus.INIT
} as YieldPoolStore;

const yieldPoolInfoSlice = createSlice({
  initialState,
  name: 'yieldPoolInfo',
  reducers: {
    updateYieldPoolInfo (state, action: PayloadAction<YieldPoolInfo[]>) {
      const poolInfo: Record<string, YieldPoolInfo> = {};

      action.payload.forEach((yieldPool) => {
        poolInfo[yieldPool.slug] = yieldPool;
      });

      return {
        poolInfo,
        reduxStatus: ReduxStatus.READY
      };
    }
  }
});

export const { updateYieldPoolInfo } = yieldPoolInfoSlice.actions;
export default yieldPoolInfoSlice.reducer;
