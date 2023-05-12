// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit/dist';
import { AuthUrlInfo } from '@subwallet/extension-base/background/handlers/State';
import { ThemeNames, UiSettings } from '@subwallet/extension-base/background/KoniTypes';
import { DEFAULT_CHAIN_PATROL_ENABLE, DEFAULT_NOTIFICATION_TYPE, DEFAULT_THEME } from '@subwallet/extension-base/services/setting-service/constants';
import { AppSettings, ReduxStatus } from '@subwallet/extension-koni-ui/stores/types';

import settings from '@polkadot/ui-settings';
import { SettingsStruct } from '@polkadot/ui-settings/types';

const initialState: AppSettings = {
  // Polkadot settings
  ...settings.get(),

  // UI settings
  isShowBalance: false,
  isShowZeroBalance: true,
  accountAllLogo: '',
  theme: DEFAULT_THEME,
  language: 'en',
  browserConfirmationType: DEFAULT_NOTIFICATION_TYPE,
  camera: false,
  enableChainPatrol: DEFAULT_CHAIN_PATROL_ENABLE,

  // AuthUrls
  authUrls: {},

  // Media settings
  mediaAllowed: false,

  reduxStatus: ReduxStatus.INIT,
  logoMaps: {
    chainLogoMap: {},
    assetLogoMap: {}
  }
};

const settingsSlice = createSlice({
  initialState,
  name: 'settings',
  reducers: {
    updateUiSettings (state, action: PayloadAction<UiSettings>) {
      const payload = action.payload;
      const { theme, ...newState } = payload;

      return {
        ...state,
        ...newState,
        reduxStatus: ReduxStatus.READY
      };
    },
    updateAppSettings (state, action: PayloadAction<SettingsStruct>) {
      const { camera, notification, ...payload } = action.payload;

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

      if (theme === state.theme) {
        return state;
      }

      return {
        ...state,
        theme
      };
    },
    updateShowZeroBalanceState (state, action: PayloadAction<boolean>) {
      const isShowZeroBalance = action.payload;

      return {
        ...state,
        isShowZeroBalance
      };
    },
    updateLanguage (state, action: PayloadAction<AppSettings['language']>) {
      return {
        ...state,
        language: action.payload
      };
    },
    updateBrowserConfirmationType (state, action: PayloadAction<AppSettings['browserConfirmationType']>) {
      return {
        ...state,
        browserConfirmationType: action.payload
      };
    },
    updateLogoMaps (state, action: PayloadAction<AppSettings['logoMaps']>) {
      return {
        ...state,
        logoMaps: action.payload
      };
    }
  }
});

export const { updateAppSettings, updateAuthUrls, updateUiSettings } = settingsSlice.actions;
export default settingsSlice.reducer;
