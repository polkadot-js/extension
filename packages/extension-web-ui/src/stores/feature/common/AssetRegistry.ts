// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { _AssetRef, _ChainAsset, _MultiChainAsset } from '@subwallet/chain-list/types';
import { AssetSetting } from '@subwallet/extension-base/background/KoniTypes';
import { AssetRegistryStore, ReduxStatus } from '@subwallet/extension-web-ui/stores/types';

const initialState: AssetRegistryStore = {
  assetRegistry: {},
  multiChainAssetMap: {},
  assetSettingMap: {},
  xcmRefMap: {},
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
        assetSettingMap: state.assetSettingMap,
        assetRegistry: payload,
        xcmRefMap: state.xcmRefMap,
        reduxStatus: ReduxStatus.READY
      };
    },
    updateMultiChainAssetMap (state, action: PayloadAction<Record<string, _MultiChainAsset>>) {
      const { payload } = action;

      return {
        assetRegistry: state.assetRegistry,
        assetSettingMap: state.assetSettingMap,
        multiChainAssetMap: payload,
        xcmRefMap: state.xcmRefMap,
        reduxStatus: ReduxStatus.READY
      };
    },
    updateAssetSettingMap (state, action: PayloadAction<Record<string, AssetSetting>>) {
      const { payload } = action;

      return {
        assetRegistry: state.assetRegistry,
        multiChainAssetMap: state.multiChainAssetMap,
        assetSettingMap: payload,
        xcmRefMap: state.xcmRefMap,
        reduxStatus: ReduxStatus.READY
      };
    },
    updateXcmRefMap (state, action: PayloadAction<Record<string, _AssetRef>>) {
      const { payload } = action;

      return {
        assetRegistry: state.assetRegistry,
        multiChainAssetMap: state.multiChainAssetMap,
        assetSettingMap: state.assetSettingMap,
        xcmRefMap: payload,
        reduxStatus: ReduxStatus.READY
      };
    }
  }
});

export const { updateAssetRegistry, updateAssetSettingMap, updateMultiChainAssetMap, updateXcmRefMap } = assetRegistrySlice.actions;
export default assetRegistrySlice.reducer;
