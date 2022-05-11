// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { TransactionHistoryItemType } from '@polkadot/extension-base/background/KoniTypes';
import { TransactionHistoryReducerType } from '@polkadot/extension-koni-ui/stores/types';

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

export const { update: updateTransactionHistory } = transactionHistorySlice.actions;
export default transactionHistorySlice.reducer;
