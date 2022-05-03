// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit/dist';

import { ResponseSettingsType } from '@polkadot/extension-base/background/KoniTypes';

const initialState = {
  isShowBalance: false,
  accountAllLogo: ''
} as ResponseSettingsType;

const settingsSlice = createSlice({
  initialState,
  name: 'settings',
  reducers: {
    update (state, action: PayloadAction<ResponseSettingsType>) {
      const payload = action.payload;

      state.isShowBalance = payload.isShowBalance;
      state.accountAllLogo = payload.accountAllLogo;
    }
  }
});

export const { update } = settingsSlice.actions;
export default settingsSlice.reducer;
