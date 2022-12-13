// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { configureStore } from '@reduxjs/toolkit/dist';

import AllAccountReducer from './AllAccount';
import AuthUrlReducer from './AuthUrl';
import BalanceReducer from './Balance';
import BondingParamsReducer from './BondingParams';
import ChainInfoMapReducer from './ChainInfoMap';
import ChainRegistryReducer from './ChainRegistry';
import CrowdloanReducer from './Crowdloan';
import CurrentAccountReducer from './CurrentAccount';
import CurrentNetworkReducer from './CurrentNetwork';
import CustomTokenReducer from './CustomToken';
import NetworkConfigParamsReducer from './NetworkConfigParams';
import NetworkMapReducer from './NetworkMap';
import NftReducer from './Nft';
import NftCollectionReducer from './NftCollection';
import PriceReducer from './Price';
import SettingsReducer from './Settings';
import stakeCompoundParamsReducer from './StakeCompound';
import StakeUnlockingReducer from './StakeUnlockingInfo';
import StakingReducer from './Staking';
import StakingRewardReducer from './StakingReward';
import TokenConfigReducer from './TokenConfigParams';
import TransactionHistoryReducer from './TransactionHistory';
import TransferNftExtraReducer from './TransferNftExtra';
import TransferNftParamsReducer from './TransferNftParams';
import UnbondingParamsReducer from './UnbondingParams';

const reducers = {
  stakeCompoundParams: stakeCompoundParamsReducer,
  stakeUnlockingInfo: StakeUnlockingReducer,
  unbondingParams: UnbondingParamsReducer,
  bondingParams: BondingParamsReducer,
  networkConfigParams: NetworkConfigParamsReducer,
  networkMap: NetworkMapReducer,
  tokenConfigParams: TokenConfigReducer,
  customToken: CustomTokenReducer,
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
  allAccount: AllAccountReducer,
  settings: SettingsReducer,
  authUrl: AuthUrlReducer,

  chainInfoMap: ChainInfoMapReducer
};

export const store = configureStore({
  devTools: process.env.NODE_ENV !== 'production',
  reducer: reducers
});

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
