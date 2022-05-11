// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CurrentNetworkInfo } from '@subwallet/extension-base/background/KoniTypes';

const initialState: CurrentNetworkInfo = {
  networkPrefix: -1,
  icon: 'polkadot',
  genesisHash: '',
  networkKey: 'all',
  isEthereum: false
};

const currentNetworkSlice = createSlice({
  initialState,
  name: 'currentNetwork',
  reducers: {
    update (state, action: PayloadAction<CurrentNetworkInfo>) {
      const payload = action.payload;

      if (!state.isReady) {
        state.isReady = true;
      }

      state.networkPrefix = payload.networkPrefix;
      state.icon = payload.icon;
      state.genesisHash = payload.genesisHash;
      state.networkKey = payload.networkKey;
      state.isEthereum = payload.isEthereum;
    }
  }
});

export const { update: updateCurrentNetwork } = currentNetworkSlice.actions;
export default currentNetworkSlice.reducer;
