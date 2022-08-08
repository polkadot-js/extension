// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit/dist';
import { AuthUrls } from '@subwallet/extension-base/background/handlers/State';

const initialState = {} as AuthUrls;

const authUrlSlice = createSlice({
  initialState,
  name: 'authUrl',
  reducers: {
    update (state: AuthUrls, action: PayloadAction<AuthUrls>) {
      const { payload } = action;

      Object.assign(state, payload);
    }
  }
});

export const { update: updateAuthUrl } = authUrlSlice.actions;
export default authUrlSlice.reducer;
