// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { PriceJson } from '@polkadot/extension-base/background/KoniTypes';

const initialState = {
  currency: 'usd',
  priceMap: {},
  ready: false
} as PriceJson;

const priceSlice = createSlice({
  initialState,
  name: 'price',
  reducers: {
    update (state, action: PayloadAction<PriceJson>) {
      const payload = action.payload;

      console.log(payload);
      state.currency = payload.currency;
      state.priceMap = payload.priceMap;
      state.ready = true;
    }
  }
});

export const { update } = priceSlice.actions;
export default priceSlice.reducer;
