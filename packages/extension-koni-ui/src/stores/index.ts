// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { combineReducers, configureStore } from '@reduxjs/toolkit/dist';
import { FLUSH, PAUSE, PERSIST, persistReducer, persistStore, PURGE, REGISTER, REHYDRATE } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import AccountStateReducer from './base/AccountState';
import RequestStateReducer from './base/RequestState';
import SettingsReducer from './base/Settings';
import UIViewStateReducer from './base/UIViewState';
import BalanceReducer from './feature/Balance';
import BondingReducer from './feature/Bonding';
import AssetRegistryReducer from './feature/common/AssetRegistry';
import ChainStoreReducer from './feature/common/ChainStore';
import CrowdloanReducer from './feature/Crowdloan';
import MantaPayReducer from './feature/MantaPay';
import NftReducer from './feature/Nft';
import PriceReducer from './feature/Price';
import StakingReducer from './feature/Staking';
import TransactionHistoryReducer from './feature/TransactionHistory';
import WalletConnectReducer from './feature/WalletConnect';
import YieldPoolInfoReducer from './feature/YieldPoolInfo';

const persistConfig = {
  key: 'root',
  version: 1,
  storage: storage,
  whitelist: [
    'settings',
    'uiViewState',
    'staking'
  ]
};

const rootReducers = combineReducers({
  // feature
  transactionHistory: TransactionHistoryReducer,
  crowdloan: CrowdloanReducer,
  nft: NftReducer,
  staking: StakingReducer,
  price: PriceReducer,
  balance: BalanceReducer,
  bonding: BondingReducer,
  mantaPay: MantaPayReducer,

  // common
  chainStore: ChainStoreReducer,
  assetRegistry: AssetRegistryReducer,

  // yield
  yieldPool: YieldPoolInfoReducer,

  // base
  requestState: RequestStateReducer,
  settings: SettingsReducer,
  accountState: AccountStateReducer,
  uiViewState: UIViewStateReducer,

  // wallet connect
  walletConnect: WalletConnectReducer
});

const persistedReducer = persistReducer(persistConfig, rootReducers);

export const store = configureStore({
  devTools: process.env.NODE_ENV !== 'production',
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
      }
    })
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>
export type StoreName = keyof RootState
export type AppStore = typeof store
export type AppDispatch = typeof store.dispatch
