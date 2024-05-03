// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit/dist';
import { CampaignBanner } from '@subwallet/extension-base/background/KoniTypes';
import { CampaignStore, ReduxStatus } from '@subwallet/extension-koni-ui/stores/types';

const initialState: CampaignStore = {
  banners: [],
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
    }
  }
});

export const { updateBanner } = campaignSlice.actions;
export default campaignSlice.reducer;
