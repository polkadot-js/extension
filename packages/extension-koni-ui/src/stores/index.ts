// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { configureStore } from '@reduxjs/toolkit/dist';

import AccountStateReducer from './base/AccountState';
import RequestStateReducer from './base/RequestState';
import SettingsReducer from './base/Settings';
import BalanceReducer from './feature/Balance';
import AssetRegistryReducer from './feature/common/AssetRegistry';
import ChainStoreReducer from './feature/common/ChainStore';
import CrowdloanReducer from './feature/Crowdloan';
import NftReducer from './feature/Nft';
import PriceReducer from './feature/Price';
import StakingReducer from './feature/Staking';
import TransactionHistoryReducer from './feature/TransactionHistory';

const reducers = {
  // feature
  transactionHistory: TransactionHistoryReducer,
  crowdloan: CrowdloanReducer,
  nft: NftReducer,
  staking: StakingReducer,
  price: PriceReducer,
  balance: BalanceReducer,

  // common
  chainStore: ChainStoreReducer,
  assetRegistry: AssetRegistryReducer,

  // base
  requestState: RequestStateReducer,
  settings: SettingsReducer,
  accountState: AccountStateReducer
};

export const store = configureStore({
  devTools: process.env.NODE_ENV !== 'production',
  reducer: reducers
});

export type RootState = ReturnType<typeof store.getState>
export type StoreName = keyof RootState
export type AppStore = typeof store
export type AppDispatch = typeof store.dispatch
