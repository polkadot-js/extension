// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { _ChainAsset } from '@subwallet/chain-list/types';
import { AssetRegistryStore, ReduxStatus } from '@subwallet/extension-koni-ui/stores/types';

const initialState: AssetRegistryStore = {
  assetRegistry: {},
  reduxStatus: ReduxStatus.INIT
};

const assetRegistrySlice = createSlice({
  initialState,
  name: 'assetRegistry',
  reducers: {
    update (state, action: PayloadAction<Record<string, _ChainAsset>>) {
      const { payload } = action;

      return {
        assetRegistry: payload,
        reduxStatus: ReduxStatus.READY
      };
    }
  }
});

export const { update } = assetRegistrySlice.actions;
export default assetRegistrySlice.reducer;
