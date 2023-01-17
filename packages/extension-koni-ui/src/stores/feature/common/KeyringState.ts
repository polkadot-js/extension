// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { KeyringState } from '@subwallet/extension-base/background/KoniTypes';

const initialState: KeyringState = {
  isReady: false,
  hasMasterPassword: false,
  isLocked: true
};

const keyringStateSlice = createSlice({
  initialState,
  name: 'keyringState',
  reducers: {
    update (state, action: PayloadAction<KeyringState>) {
      const payload = action.payload;

      return {
        ...state,
        ...payload
      };
    }
  }
});

export const { update } = keyringStateSlice.actions;
export default keyringStateSlice.reducer;
