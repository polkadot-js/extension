// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit/dist';
import { MantaPayConfig } from '@subwallet/extension-base/background/KoniTypes';
import { MantaPayStore, ReduxStatus } from '@subwallet/extension-koni-ui/stores/types';

const initialState: MantaPayStore = {
  configs: [],
  reduxStatus: ReduxStatus.INIT
};

const mantaPaySlice = createSlice({
  initialState,
  name: 'mantaPay',
  reducers: {
    updateConfig (state, action: PayloadAction<MantaPayConfig[]>) {
      const payload = action.payload;

      return {
        configs: payload,
        reduxStatus: ReduxStatus.READY
      };
    }
  }
});

export const { updateConfig } = mantaPaySlice.actions;
export default mantaPaySlice.reducer;
