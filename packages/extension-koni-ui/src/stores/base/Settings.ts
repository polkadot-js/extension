// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit/dist';
import { AuthUrlInfo } from '@subwallet/extension-base/background/handlers/State';
import { ThemeNames, UiSettings } from '@subwallet/extension-base/background/KoniTypes';
import { AppSettings, ReduxStatus } from '@subwallet/extension-koni-ui/stores/types';

import settings from '@polkadot/ui-settings';
import { SettingsStruct } from '@polkadot/ui-settings/types';

const initialState = {
  // UI settings
  isShowBalance: false,
  accountAllLogo: '',
  theme: ThemeNames.DARK,

  // Polkadot settings
  ...settings.get(),

  // AuthUrls
  authUrls: {},

  // Media settings
  mediaAllowed: false,

  reduxStatus: ReduxStatus.INIT
} as AppSettings;

const settingsSlice = createSlice({
  initialState,
  name: 'settings',
  reducers: {
    updateUiSettings (state, action: PayloadAction<UiSettings>) {
      const payload = action.payload;

      return {
        ...state,
        ...payload,
        reduxStatus: ReduxStatus.READY
      };
    },
    updateAppSettings (state, action: PayloadAction<SettingsStruct>) {
      const payload = action.payload;

      return {
        ...state,
        ...payload,
        reduxStatus: ReduxStatus.READY
      };
    },
    updateAuthUrls (state, action: PayloadAction<Record<string, AuthUrlInfo>>) {
      const payload = action.payload;

      return {
        ...state,
        authUrls: payload,
        reduxStatus: ReduxStatus.READY
      };
    },
    updateMediaAllowance (state, action: PayloadAction<boolean>) {
      const payload = action.payload;

      return {
        ...state,
        mediaAllowed: payload,
        reduxStatus: ReduxStatus.READY
      };
    },
    updateTheme (state, action: PayloadAction<ThemeNames>) {
      const theme = action.payload;

      return {
        ...state,
        theme
      };
    }
  }
});

export const { updateAppSettings, updateAuthUrls, updateUiSettings } = settingsSlice.actions;
export default settingsSlice.reducer;
