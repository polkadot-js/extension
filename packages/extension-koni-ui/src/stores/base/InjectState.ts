// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { InjectStore, ReduxStatus } from '@subwallet/extension-koni-ui/stores/types';

const initialState: InjectStore = {
  injectDone: false,
  reduxStatus: ReduxStatus.INIT
};

const injectStateSlice = createSlice({
  initialState,
  name: 'injectState',
  reducers: {
    waitInject (state, action: PayloadAction<boolean>) {
      const payload = action.payload;

      return {
        ...state,
        injectDone: payload,
        reduxStatus: ReduxStatus.READY
      };
    }
  }
});

export const { waitInject } = injectStateSlice.actions;
export default injectStateSlice.reducer;
