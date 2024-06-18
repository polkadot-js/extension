// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit/dist';
import { AppOnlineContent, ReduxStatus } from '@subwallet/extension-koni-ui/stores/types';
import { AppBannerData, AppConfirmationData, AppPopupData, PopupHistoryData } from '@subwallet/extension-koni-ui/types/staticContent';

const initialState = {
  appPopupData: [],
  appConfirmationData: [],
  appBannerData: [],
  popupHistoryMap: {},
  bannerHistoryMap: {},
  confirmationHistoryMap: {},
  reduxStatus: ReduxStatus.INIT
} as AppOnlineContent;

const staticContentSlice = createSlice({
  initialState,
  name: 'staticContent',
  reducers: {
    updateAppPopupData (state, action: PayloadAction<AppPopupData[]>) {
      const payload = action.payload;

      return {
        ...state,
        appPopupData: payload,
        reduxStatus: ReduxStatus.READY
      };
    },
    updateAppBannerData (state, action: PayloadAction<AppBannerData[]>) {
      const payload = action.payload;

      return {
        ...state,
        appBannerData: payload,
        reduxStatus: ReduxStatus.READY
      };
    },
    updateAppConfirmationData (state, action: PayloadAction<AppConfirmationData[]>) {
      const payload = action.payload;

      return {
        ...state,
        appConfirmationData: payload,
        reduxStatus: ReduxStatus.READY
      };
    },
    updatePopupHistoryData (state, action: PayloadAction<Record<string, PopupHistoryData>>) {
      const payload = action.payload;

      return {
        ...state,
        popupHistoryMap: payload,
        reduxStatus: ReduxStatus.READY
      };
    },
    updateBannerHistoryData (state, action: PayloadAction<Record<string, PopupHistoryData>>) {
      const payload = action.payload;

      return {
        ...state,
        bannerHistoryMap: payload,
        reduxStatus: ReduxStatus.READY
      };
    },
    updateConfirmationHistoryData (state, action: PayloadAction<Record<string, PopupHistoryData>>) {
      const payload = action.payload;

      return {
        ...state,
        confirmationHistoryMap: payload,
        reduxStatus: ReduxStatus.READY
      };
    }
  }
});

export const { updateAppBannerData,
  updateAppConfirmationData,
  updateAppPopupData,
  updateBannerHistoryData,
  updateConfirmationHistoryData,
  updatePopupHistoryData } = staticContentSlice.actions;
export default staticContentSlice.reducer;
