// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit/dist';
import { MantaPayConfig, MantaPaySyncState } from '@subwallet/extension-base/background/KoniTypes';
import { MantaPayStore, ReduxStatus } from '@subwallet/extension-koni-ui/stores/types';

const initialState: MantaPayStore = {
  configs: [],
  isSyncing: false,
  progress: -1,
  reduxStatus: ReduxStatus.INIT
};

const mantaPaySlice = createSlice({
  initialState,
  name: 'mantaPay',
  reducers: {
    updateConfig (state, action: PayloadAction<MantaPayConfig[]>) {
      const payload = action.payload;

      return {
        isSyncing: state.isSyncing,
        configs: payload,
        progress: state.progress,
        reduxStatus: ReduxStatus.READY
      };
    },
    updateIsSyncing (state, action: PayloadAction<MantaPaySyncState>) {
      const payload = action.payload;

      return {
        isSyncing: payload.isSyncing,
        progress: payload.progress,
        configs: state.configs,
        reduxStatus: ReduxStatus.READY
      };
    }
  }
});

export const { updateConfig, updateIsSyncing } = mantaPaySlice.actions;
export default mantaPaySlice.reducer;
