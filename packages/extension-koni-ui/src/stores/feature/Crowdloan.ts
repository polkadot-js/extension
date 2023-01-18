// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit/dist';
import { CrowdloanItem } from '@subwallet/extension-base/background/KoniTypes';
import { CrowdloanStore, ReduxStatus } from '@subwallet/extension-koni-ui/stores/types';

const initialState: CrowdloanStore = {
  crowdloanMap: {},
  reduxStatus: ReduxStatus.INIT
};

const crowdloanSlice = createSlice({
  initialState,
  name: 'crowdloan',
  reducers: {
    update (state, action: PayloadAction<Record<string, CrowdloanItem>>) {
      const payload = action.payload;

      return {
        crowdloanMap: payload,
        reduxStatus: ReduxStatus.READY
      };
    }
  }
});

export const { update } = crowdloanSlice.actions;
export default crowdloanSlice.reducer;
