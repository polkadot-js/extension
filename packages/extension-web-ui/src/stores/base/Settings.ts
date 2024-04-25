// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit/dist';
import { AuthUrlInfo } from '@subwallet/extension-base/background/handlers/State';
import { ThemeNames, UiSettings } from '@subwallet/extension-base/background/KoniTypes';
import { LANGUAGE } from '@subwallet/extension-base/constants';
import { DEFAULT_SETTING } from '@subwallet/extension-base/services/setting-service/constants';
import { AppSettings, ReduxStatus } from '@subwallet/extension-web-ui/stores/types';

import settings from '@polkadot/ui-settings';

const initialState: AppSettings = {
  // Polkadot settings
  ...settings.get(),

  // UI settings

  ...DEFAULT_SETTING,

  // AuthUrls
  authUrls: {},

  // Media settings
  mediaAllowed: false,

  logoMaps: {
    chainLogoMap: {},
    assetLogoMap: {}
  },
  reduxStatus: ReduxStatus.INIT
};

const settingsSlice = createSlice({
  initialState,
  name: 'settings',
  reducers: {
    updateUiSettings (state, action: PayloadAction<UiSettings>) {
      const payload = action.payload;

      if (payload.language !== state.language) {
        localStorage.setItem(LANGUAGE, payload.language); // cache language;
      }

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
    updateCurrency (state, action: PayloadAction<AppSettings['currency']>) {
      return {
        ...state,
        currency: action.payload
      };
    },
    updateBrowserConfirmationType (state, action: PayloadAction<AppSettings['browserConfirmationType']>) {
      return {
        ...state,
        browserConfirmationType: action.payload
      };
    },
    updateChainLogoMaps (state, action: PayloadAction<Record<string, string>>) {
      const chainLogoMap = action.payload;

      return {
        ...state,
        logoMaps: {
          chainLogoMap: {
            ...state.logoMaps.chainLogoMap,
            ...chainLogoMap
          },
          assetLogoMap: state.logoMaps.assetLogoMap
        }
      };
    },
    updateAssetLogoMaps (state, action: PayloadAction<Record<string, string>>) {
      const assetLogoMap = action.payload;

      return {
        ...state,
        logoMaps: {
          chainLogoMap: state.logoMaps.chainLogoMap,
          assetLogoMap: {
            ...state.logoMaps.assetLogoMap,
            ...assetLogoMap
          }
        }
      };
    }
  }
});

export const { updateAuthUrls, updateUiSettings } = settingsSlice.actions;
export default settingsSlice.reducer;
