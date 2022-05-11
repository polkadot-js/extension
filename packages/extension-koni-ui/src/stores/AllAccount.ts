// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit/dist';

const initialState = {
  allAccountLogo: ''
};

const allAccountSlice = createSlice({
  initialState,
  name: 'allAccount',
  reducers: {
    update (state, action: PayloadAction<any>) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const payload = action.payload;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      state.allAccountLogo = payload.allAccountLogo;
    }
  }
});

export const { update } = allAccountSlice.actions;
export default allAccountSlice.reducer;
