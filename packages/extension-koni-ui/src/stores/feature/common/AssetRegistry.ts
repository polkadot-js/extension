// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { _ChainAsset, _MultiChainAsset } from '@subwallet/chain-list/types';
import { AssetRegistryStore, ReduxStatus } from '@subwallet/extension-koni-ui/stores/types';

const initialState: AssetRegistryStore = {
  assetRegistry: {},
  multiChainAssetMap: {},
  reduxStatus: ReduxStatus.INIT
};

const assetRegistrySlice = createSlice({
  initialState,
  name: 'assetRegistry',
  reducers: {
    updateAssetRegistry (state, action: PayloadAction<Record<string, _ChainAsset>>) {
      const { payload } = action;

      return {
        multiChainAssetMap: state.multiChainAssetMap,
        assetRegistry: payload,
        reduxStatus: ReduxStatus.READY
      };
    },
    updateMultiChainAssetMap (state, action: PayloadAction<Record<string, _MultiChainAsset>>) {
      const { payload } = action;

      return {
        assetRegistry: state.assetRegistry,
        multiChainAssetMap: payload,
        reduxStatus: ReduxStatus.READY
      };
    }
  }
});

export const { updateAssetRegistry, updateMultiChainAssetMap } = assetRegistrySlice.actions;
export default assetRegistrySlice.reducer;
