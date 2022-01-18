// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { AccountJson } from '@polkadot/extension-base/background/types';

const initialState = {} as AccountJson;

const currentAccountSlice = createSlice({
  initialState,
  name: 'currentAccount',
  reducers: {
    updateAccount (state, action: PayloadAction<AccountJson>) {
      const payload = action.payload;

      Object.assign(state, payload);
    }
  }
});

export const { updateAccount } = currentAccountSlice.actions;
export default currentAccountSlice.reducer;
