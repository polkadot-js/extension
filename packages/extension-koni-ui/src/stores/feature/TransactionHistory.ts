// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TransactionHistoryItem } from '@subwallet/extension-base/background/KoniTypes';
import { TransactionHistoryReducerType } from '@subwallet/extension-koni-ui/stores/types';

const initialState = { historyList: [] } as TransactionHistoryReducerType;

const transactionHistorySlice = createSlice({
  initialState,
  name: 'transactionHistory',
  reducers: {
    update (state, action: PayloadAction<TransactionHistoryItem[]>) {
      return {
        historyList: action.payload
      } as TransactionHistoryReducerType;
    }
  }
});

export const { update } = transactionHistorySlice.actions;
export default transactionHistorySlice.reducer;
