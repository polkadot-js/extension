// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit/dist';

import { CrowdloanJson } from '@polkadot/extension-base/background/KoniTypes';

const initialState = {
  details: {}
} as CrowdloanJson;

const crowdloanSlice = createSlice({
  initialState,
  name: 'crowdloan',
  reducers: {
    update (state, action: PayloadAction<CrowdloanJson>) {
      const payload = action.payload;

      state.details = payload.details;
    }
  }
});

export const { update } = crowdloanSlice.actions;
export default crowdloanSlice.reducer;
