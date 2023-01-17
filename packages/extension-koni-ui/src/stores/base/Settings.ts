// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit/dist';
import { ThemeTypes, UiSettings } from '@subwallet/extension-base/background/KoniTypes';
import { AppSettings } from '@subwallet/extension-koni-ui/stores/types';

import settings from '@polkadot/ui-settings';
import { SettingsStruct } from '@polkadot/ui-settings/types';

const initialState = {
  isShowBalance: false,
  accountAllLogo: '',
  theme: ThemeTypes.DARK,

  ...settings.get()
} as AppSettings;

const settingsSlice = createSlice({
  initialState,
  name: 'settings',
  reducers: {
    updateUiSettings (state, action: PayloadAction<UiSettings>) {
      const payload = action.payload;

      state.isShowBalance = payload.isShowBalance;
      state.accountAllLogo = payload.accountAllLogo;
      state.theme = payload.theme;
    },
    updateAppSettings (state, action: PayloadAction<SettingsStruct>) {
      const payload = action.payload;

      state.apiType = payload.apiType;
      state.apiUrl = payload.apiUrl;
      state.camera = payload.camera;
      state.i18nLang = payload.i18nLang;
      state.ledgerConn = payload.ledgerConn;
      state.locking = payload.locking;
      state.notification = payload.notification;
      state.prefix = payload.prefix;
      state.uiMode = payload.uiMode;
      state.uiTheme = payload.uiTheme;
    }
  }
});

export const { updateAppSettings, updateUiSettings } = settingsSlice.actions;
export default settingsSlice.reducer;
