// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { NetworkConfigParams } from '@subwallet/extension-koni-ui/stores/types';

const initialState = {
  mode: 'create',
  data: {
    active: false,
    currentProvider: '',
    currentProviderMode: 'ws',
    genesisHash: '',
    groups: [],
    providers: {},
    ss58Format: 0,
    key: '',
    chain: '',
    isEthereum: false
  }
} as NetworkConfigParams;

const networkConfigParamsSlice = createSlice({
  initialState,
  name: 'networkConfigParams',
  reducers: {
    update (state, action: PayloadAction<NetworkConfigParams>) {
      const payload = action.payload;

      state.data = payload.data;
      state.mode = payload.mode;
    }
  }
});

export const { update } = networkConfigParamsSlice.actions;
export default networkConfigParamsSlice.reducer;
