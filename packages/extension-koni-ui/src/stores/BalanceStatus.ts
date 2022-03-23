// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit/dist';

const initialState = {
  isShowBalance: false
};

const balanceStatusSlice = createSlice({
  initialState,
  name: 'balanceStatus',
  reducers: {
    update (state, action: PayloadAction<any>) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const payload = action.payload;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      state.isShowBalance = payload.isShowBalance;
    }
  }
});

export const { update } = balanceStatusSlice.actions;
export default balanceStatusSlice.reducer;
