// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { configureStore } from '@reduxjs/toolkit/dist';

import AllAccountReducer from './AllAccount';
import BalanceReducer from './Balance';
import ChainRegistryReducer from './ChainRegistry';
import CrowdloanReducer from './Crowdloan';
import CurrentAccountReducer from './CurrentAccount';
import CurrentNetworkReducer from './CurrentNetwork';
import EvmTokenReducer from './EvmToken';
import NetworkConfigParamsReducer from './NetworkConfigParams';
import NetworkMapReducer from './NetworkMap';
import NetworkMetadataReducer from './NetworkMetadata';
import NftReducer from './Nft';
import NftCollectionReducer from './NftCollection';
import PriceReducer from './Price';
import SettingsReducer from './Settings';
import StakingReducer from './Staking';
import StakingRewardReducer from './StakingReward';
import TokenConfigReducer from './TokenConfigParams';
import TransactionHistoryReducer from './TransactionHistory';
import TransferNftExtraReducer from './TransferNftExtra';
import TransferNftParamsReducer from './TransferNftParams';

const reducers = {
  networkConfigParams: NetworkConfigParamsReducer,
  networkMap: NetworkMapReducer,
  tokenConfigParams: TokenConfigReducer,
  evmToken: EvmTokenReducer,
  transferNftExtra: TransferNftExtraReducer,
  transferNftParams: TransferNftParamsReducer,
  stakingReward: StakingRewardReducer,
  staking: StakingReducer,
  nftCollection: NftCollectionReducer,
  nft: NftReducer,
  price: PriceReducer,
  balance: BalanceReducer,
  crowdloan: CrowdloanReducer,
  transactionHistory: TransactionHistoryReducer,
  currentAccount: CurrentAccountReducer,
  currentNetwork: CurrentNetworkReducer,
  chainRegistry: ChainRegistryReducer,
  networkMetadata: NetworkMetadataReducer,
  allAccount: AllAccountReducer,
  settings: SettingsReducer
};

export const store = configureStore({
  devTools: process.env.NODE_ENV !== 'production',
  reducer: reducers
});

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
