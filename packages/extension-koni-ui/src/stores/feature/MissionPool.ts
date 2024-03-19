// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MissionPoolStore, ReduxStatus } from '@subwallet/extension-koni-ui/stores/types';

const initialState: MissionPoolStore = {
  missions: [],
  reduxStatus: ReduxStatus.INIT
};

const missionPoolSlice = createSlice({
  initialState,
  name: 'missionPool',
  reducers: {
    update (state, action: PayloadAction<MissionPoolStore>) {
      const { payload } = action;

      const reduxStatus = payload.reduxStatus || ReduxStatus.READY;

      return {
        ...payload,
        reduxStatus
      };
    }
  }
});

export default missionPoolSlice.reducer;
