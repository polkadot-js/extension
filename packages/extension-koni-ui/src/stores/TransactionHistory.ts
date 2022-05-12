// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TransactionHistoryItemType } from '@subwallet/extension-base/background/KoniTypes';
import { TransactionHistoryReducerType } from '@subwallet/extension-koni-ui/stores/types';

const initialState = { historyMap: {} } as TransactionHistoryReducerType;

const transactionHistorySlice = createSlice({
  initialState,
  name: 'transactionHistory',
  reducers: {
    update (state, action: PayloadAction<Record<string, TransactionHistoryItemType[]>>) {
      state.historyMap = action.payload;
    }
  }
});

export const { update: updateCurrentAccount } = transactionHistorySlice.actions;
export default transactionHistorySlice.reducer;
