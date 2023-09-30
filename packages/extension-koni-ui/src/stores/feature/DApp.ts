// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DAppStore, ReduxStatus } from '@subwallet/extension-koni-ui/stores/types';

const initialState: DAppStore = {
  featureDApps: [],
  dApps: [],
  reduxStatus: ReduxStatus.INIT
};

const dAppSlice = createSlice({
  initialState,
  name: 'dApp',
  reducers: {
    update (state, action: PayloadAction<DAppStore>) {
      const { payload } = action;

      const reduxStatus = payload.reduxStatus || ReduxStatus.READY;

      return {
        ...payload,
        reduxStatus
      };
    }
  }
});

export default dAppSlice.reducer;
