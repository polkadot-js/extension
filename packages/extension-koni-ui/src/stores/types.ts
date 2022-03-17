// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NftCollection, NftItem, TransactionHistoryItemType } from '@polkadot/extension-base/background/KoniTypes';
import { AccountJson } from '@polkadot/extension-base/background/types';

export type CurrentAccountType = {
  account?: AccountJson | null;
}

export type TransactionHistoryReducerType = {
  historyMap: Record<string, TransactionHistoryItemType[]>
}

export type TransferNftParams = {
  nftItem: NftItem;
  collectionImage?: string;
  collectionId: string;
}
