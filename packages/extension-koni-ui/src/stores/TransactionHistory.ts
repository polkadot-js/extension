// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { TransactionHistoryItemType } from '@polkadot/extension-base/background/KoniTypes';
import { TransactionHistoryReducerType } from '@polkadot/extension-koni-ui/stores/types';

const initialState = { items: [] } as TransactionHistoryReducerType;

const transactionHistorySlice = createSlice({
  initialState,
  name: 'transactionHistory',
  reducers: {
    update (state, action: PayloadAction<TransactionHistoryItemType[]>) {
      state.items = action.payload;
    }
  }
});

export const { update: updateCurrentAccount } = transactionHistorySlice.actions;
export default transactionHistorySlice.reducer;
