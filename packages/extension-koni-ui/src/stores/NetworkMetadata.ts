// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { NetWorkMetadataDef } from '@polkadot/extension-base/background/KoniTypes';

import chains from '../util/chains';

function getNetworkMetadataMap (networkMetaDataItems: NetWorkMetadataDef[]): Record<string, NetWorkMetadataDef> {
  const result: Record<string, NetWorkMetadataDef> = {};

  networkMetaDataItems.forEach((item) => {
    result[item.networkKey] = item;
  });

  return result;
}

const initialState = getNetworkMetadataMap(chains);
// TODO: delete this state
const networkMetadataSlice = createSlice({
  initialState,
  name: 'networkMetadata',
  reducers: {
    update (state, action: PayloadAction<NetWorkMetadataDef[]>) {
      const { payload } = action;

      payload.forEach((item) => {
        state[item.networkKey] = item;
      });
    }
  }
});

export const { update: updateNetworkMetadata } = networkMetadataSlice.actions;
export default networkMetadataSlice.reducer;
