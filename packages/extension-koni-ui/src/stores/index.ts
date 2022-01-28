// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { configureStore } from '@reduxjs/toolkit/dist';

import BalanceReducer from './Balance';
import CrowdloanReducer from './Crowdloan';
import CurrentAccountReducer from './CurrentAccount';
import CurrentNetworkReducer from './CurrentNetwork';
import PriceReducer from './Price';
import NftReducer from './Nft';
import StakingReducer from './Staking'

const reducers = {
  staking: StakingReducer,
  nft: NftReducer,
  price: PriceReducer,
  balance: BalanceReducer,
  crowdloan: CrowdloanReducer,
  currentAccount: CurrentAccountReducer,
  currentNetwork: CurrentNetworkReducer
};

export const store = configureStore({
  devTools: process.env.NODE_ENV !== 'production',
  reducer: reducers
});

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
