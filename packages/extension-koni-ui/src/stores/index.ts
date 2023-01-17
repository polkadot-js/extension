// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { configureStore } from '@reduxjs/toolkit/dist';

import AccountStateReducer from './base/AccountState';
import RequestStateReducer from './base/RequestState';
import SettingsReducer from './base/Settings';
import BalanceReducer from './feature/Balance';
import AssetRegistryReducer from './feature/common/AssetRegistry';
import ChainInfoMapReducer from './feature/common/ChainInfoMap';
import ChainStateMapReducer from './feature/common/ChainStateMap';
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
  chainInfoMap: ChainInfoMapReducer,
  chainStateMap: ChainStateMapReducer,
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
export type AppDispatch = typeof store.dispatch
