import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {TransactionHistoryReducerType} from "@polkadot/extension-koni-ui/stores/types";
import {TransactionHistoryItemType} from "@polkadot/extension-base/background/KoniTypes";

const initialState = {items: []} as TransactionHistoryReducerType;

const transactionHistorySlice = createSlice({
  initialState,
  name: 'transactionHistory',
  reducers: {
    update(state, action: PayloadAction<TransactionHistoryItemType[]>) {
      state.items = action.payload;
    }
  }
});

export const { update: updateCurrentAccount } = transactionHistorySlice.actions;
export default transactionHistorySlice.reducer;
