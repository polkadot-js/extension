// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { AccountJson } from '@polkadot/extension-base/background/types';

const initialState = {} as AccountJson;

const currentAccountSlice = createSlice({
  initialState,
  name: 'currentAccount',
  reducers: {
    update(state, action: PayloadAction<AccountJson>) {
      const payload = action.payload;

      for (let key in state) {
        if (state.hasOwnProperty(key)) {
          delete state[key];
        }
      }

      Object.assign(state, payload);
    }
  }
});

export const { update: updateCurrentAccount } = currentAccountSlice.actions;
export default currentAccountSlice.reducer;
