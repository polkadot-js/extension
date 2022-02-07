import {AccountJson} from "@polkadot/extension-base/background/types";
import {TransactionHistoryItemType} from "@polkadot/extension-base/background/KoniTypes";

export type CurrentAccountType = {
  account?: AccountJson | null;
}

export type TransactionHistoryReducerType = {
  items: TransactionHistoryItemType[]
}
