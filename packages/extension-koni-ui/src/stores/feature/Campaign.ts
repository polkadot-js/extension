// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit/dist';
import { CampaignBanner } from '@subwallet/extension-base/background/KoniTypes';
import { CampaignStore, ReduxStatus } from '@subwallet/extension-koni-ui/stores/types';

const initialState: CampaignStore = {
  banners: [],
  isShowPopup: true,
  reduxStatus: ReduxStatus.INIT
};

const campaignSlice = createSlice({
  initialState,
  name: 'campaign',
  reducers: {
    updateBanner (state, action: PayloadAction<CampaignBanner[]>) {
      return {
        ...state,
        banners: action.payload,
        reduxStatus: ReduxStatus.READY
      };
    },
    updateIsShowPopup (state, action: PayloadAction<boolean>) {
      return {
        ...state,
        isShowPopup: action.payload,
        reduxStatus: ReduxStatus.READY
      };
    }
  }
});

export const { updateBanner, updateIsShowPopup } = campaignSlice.actions;
export default campaignSlice.reducer;
