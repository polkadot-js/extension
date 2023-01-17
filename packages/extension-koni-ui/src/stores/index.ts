// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { configureStore } from '@reduxjs/toolkit/dist';

import SettingsReducer from './base/Settings';
import AllAccountReducer from './feature/common/AllAccount';
import AssetRegistryReducer from './feature/common/AssetRegistry';
import AuthUrlReducer from './feature/common/AuthUrl';
import BalanceReducer from './feature/common/Balance';
import ChainInfoMapReducer from './feature/common/ChainInfoMap';
import ChainStateMapReducer from './feature/common/ChainStateMap';
import CrowdloanReducer from './feature/common/Crowdloan';
import CurrentAccountReducer from './feature/common/CurrentAccount';
import KeyringStateReducer from './feature/common/KeyringState';
import CustomTokenReducer from './feature/CustomToken';
import BondingParamsReducer from './feature/deprecated/BondingParams';
import CurrentNetworkReducer from './feature/deprecated/CurrentNetwork';
import NetworkConfigParamsReducer from './feature/deprecated/NetworkConfigParams';
import NftCollectionReducer from './feature/deprecated/NftCollection';
import stakeCompoundParamsReducer from './feature/deprecated/StakeCompound';
import StakeUnlockingReducer from './feature/deprecated/StakeUnlockingInfo';
import StakingRewardReducer from './feature/deprecated/StakingReward';
import TokenConfigReducer from './feature/deprecated/TokenConfigParams';
import TransferNftExtraReducer from './feature/deprecated/TransferNftExtra';
import TransferNftParamsReducer from './feature/deprecated/TransferNftParams';
import UnbondingParamsReducer from './feature/deprecated/UnbondingParams';
import NftReducer from './feature/Nft';
import PriceReducer from './feature/Price';
import StakingReducer from './feature/Staking';
import TransactionHistoryReducer from './feature/TransactionHistory';

const reducers = {
  // tx history
  transactionHistory: TransactionHistoryReducer,

  // crowdloan
  crowdloan: CrowdloanReducer,

  // nft
  nftCollection: NftCollectionReducer,
  nft: NftReducer,
  transferNftExtra: TransferNftExtraReducer,
  transferNftParams: TransferNftParamsReducer,

  // staking
  stakingReward: StakingRewardReducer,
  staking: StakingReducer,
  stakeCompoundParams: stakeCompoundParamsReducer,
  stakeUnlockingInfo: StakeUnlockingReducer,
  unbondingParams: UnbondingParamsReducer,
  bondingParams: BondingParamsReducer,

  // custom network, custom token
  networkConfigParams: NetworkConfigParamsReducer,
  tokenConfigParams: TokenConfigReducer,
  customToken: CustomTokenReducer,

  // balance
  price: PriceReducer,
  balance: BalanceReducer,

  // general stores
  chainInfoMap: ChainInfoMapReducer,
  chainStateMap: ChainStateMapReducer,
  assetRegistry: AssetRegistryReducer,

  currentAccount: CurrentAccountReducer,
  currentNetwork: CurrentNetworkReducer,
  allAccount: AllAccountReducer,
  settings: SettingsReducer,
  authUrl: AuthUrlReducer,
  keyringState: KeyringStateReducer
};

export const store = configureStore({
  devTools: process.env.NODE_ENV !== 'production',
  reducer: reducers
});

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
