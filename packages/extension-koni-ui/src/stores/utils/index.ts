// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { BalanceJson, CrowdloanJson, NftCollection, NftItem, PriceJson, StakeUnlockingJson, StakingJson, StakingRewardJson, TransactionHistoryItemType } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson } from '@subwallet/extension-base/background/types';
import { _ChainState } from '@subwallet/extension-base/services/chain-service/types';
import { lazySubscribeMessage } from '@subwallet/extension-koni-ui/messaging';
import { store } from '@subwallet/extension-koni-ui/stores';

// Setup redux stores

// Base
// AccountState store
export const updateCurrentAccountState = (data: AccountJson) => {
  store.dispatch({ type: 'accountState/updateCurrentAccount', payload: data });
};

export const subscribeCurrentAccount = lazySubscribeMessage('pri(accounts.subscribeWithCurrentAddress)', {}, updateCurrentAccountState, updateCurrentAccountState);

export const updateKeyringState = (data: AccountJson) => {
  store.dispatch({ type: 'accountState/updateCurrentAccount', payload: data });
};

export const subscribeKeyringState = lazySubscribeMessage('pri(accounts.subscribeWithCurrentAddress)', {}, updateCurrentAccountState, updateCurrentAccountState);

export const updateAccountContext = (data: AccountJson) => {
  store.dispatch({ type: 'accountState/updateCurrentAccount', payload: data });
};

export const subscribeAccountContext = lazySubscribeMessage('pri(accounts.subscribeWithCurrentAddress)', {}, updateCurrentAccountState, updateCurrentAccountState);

export const updateAuthorizeRequest = (data: AccountJson) => {
  store.dispatch({ type: 'accountState/updateCurrentAccount', payload: data });
};

// RequestState store
export const subscribeAuthorizeRequest = lazySubscribeMessage('pri(accounts.subscribeWithCurrentAddress)', {}, updateCurrentAccountState, updateCurrentAccountState);

export const updateMetadataRequest = (data: AccountJson) => {
  store.dispatch({ type: 'accountState/updateCurrentAccount', payload: data });
};

export const subscribeMetadataRequest = lazySubscribeMessage('pri(accounts.subscribeWithCurrentAddress)', {}, updateCurrentAccountState, updateCurrentAccountState);

export const updateSigningRequest = (data: AccountJson) => {
  store.dispatch({ type: 'accountState/updateCurrentAccount', payload: data });
};

export const subscribeSigningRequest = lazySubscribeMessage('pri(accounts.subscribeWithCurrentAddress)', {}, updateCurrentAccountState, updateCurrentAccountState);

export const updateConfirmationQueue = (data: AccountJson) => {
  store.dispatch({ type: 'accountState/updateCurrentAccount', payload: data });
};

export const subscribeConfirmationQueue = lazySubscribeMessage('pri(accounts.subscribeWithCurrentAddress)', {}, updateCurrentAccountState, updateCurrentAccountState);

// Settings Store
export const updateUiSettings = (data: AccountJson) => {
  store.dispatch({ type: 'accountState/updateCurrentAccount', payload: data });
};

export const subscribeUiSettings = lazySubscribeMessage('pri(accounts.subscribeWithCurrentAddress)', {}, updateCurrentAccountState, updateCurrentAccountState);

export const updateAppSettings = (data: AccountJson) => {
  store.dispatch({ type: 'accountState/updateCurrentAccount', payload: data });
};

export const subscribeAppSettings = lazySubscribeMessage('pri(accounts.subscribeWithCurrentAddress)', {}, updateCurrentAccountState, updateCurrentAccountState);

export const updateAuthUrls = (data: AccountJson) => {
  store.dispatch({ type: 'accountState/updateCurrentAccount', payload: data });
};

export const subscribeAuthUrls = lazySubscribeMessage('pri(accounts.subscribeWithCurrentAddress)', {}, updateCurrentAccountState, updateCurrentAccountState);

export const updateMediaAllowance = (data: AccountJson) => {
  store.dispatch({ type: 'accountState/updateCurrentAccount', payload: data });
};

export const subscribeMediaAllowance = lazySubscribeMessage('pri(accounts.subscribeWithCurrentAddress)', {}, updateCurrentAccountState, updateCurrentAccountState);

export const updateChainInfoMap = (data: Record<string, _ChainInfo>) => {
  store.dispatch({ type: 'chainStore/updateChainInfoMap', payload: data });
};

export const subscribeChainInfoMap = lazySubscribeMessage('pri(chainService.subscribeChainInfoMap)', null, updateChainInfoMap, updateChainInfoMap);

export const updateChainStateMap = (data: Record<string, _ChainState>) => {
  store.dispatch({ type: 'chainStore/updateChainStateMap', payload: data });
};

export const subscribeChainStateMap = lazySubscribeMessage('pri(chainService.subscribeChainStateMap)', null, updateChainStateMap, updateChainStateMap);

export const updateAssetRegistry = (data: Record<string, _ChainAsset>) => {
  store.dispatch({ type: 'assetRegistry/update', payload: data });
};

export const subscribeAssetRegistry = lazySubscribeMessage('pri(chainService.subscribeAssetRegistry)', null, updateAssetRegistry, updateAssetRegistry);

// Features
export const updatePrice = (data: PriceJson) => {
  store.dispatch({ type: 'price/updatePrice', payload: data });
};

export const subscribePrice = lazySubscribeMessage('pri(price.getSubscription)', null, updatePrice, updatePrice);

export const updateBalance = (data: BalanceJson) => {
  console.log('balanceMap', data);
  store.dispatch({ type: 'balance/update', payload: data.details });
};

export const subscribeBalance = lazySubscribeMessage('pri(balance.getSubscription)', null, updateBalance, updateBalance);

export const updateCrowdloan = (data: CrowdloanJson) => {
  store.dispatch({ type: 'crowdloan/update', payload: data.details });
};

export const subscribeCrowdloan = lazySubscribeMessage('pri(crowdloan.getSubscription)', null, updateCrowdloan, updateCrowdloan);

export const updateNftItems = (data: NftItem[]) => {
  store.dispatch({ type: 'nft/updateNftItems', payload: data });
};

export const subscribeNftItems = lazySubscribeMessage('pri(nft.getSubscription)', null, updateNftItems, updateNftItems);

export const updateNftCollections = (data: NftCollection[]) => {
  store.dispatch({ type: 'nft/updateNftCollections', payload: data });
};

export const subscribeNftCollections = lazySubscribeMessage('pri(nftCollection.getSubscription)', null, updateNftCollections, updateNftCollections);

export const updateStaking = (data: StakingJson) => {
  store.dispatch({ type: 'staking/updateStaking', payload: data.details });
};

export const subscribeStaking = lazySubscribeMessage('pri(staking.getSubscription)', null, updateStaking, updateStaking);

export const updateStakingReward = (data: StakingRewardJson) => {
  store.dispatch({ type: 'staking/updateStakingReward', payload: [data.fastInterval, data.slowInterval] });
};

export const subscribeStakingReward = lazySubscribeMessage('pri(stakingReward.getSubscription)', null, updateStakingReward, updateStakingReward);

export const updateStakeUnlockingInfo = (data: StakeUnlockingJson) => {
  store.dispatch({ type: 'staking/updateStaking', payload: data.details });
};

export const subscribeStakeUnlockingInfo = lazySubscribeMessage('pri(unbonding.subscribeUnlockingInfo)', null, updateStakeUnlockingInfo, updateStakeUnlockingInfo);

export const updateTxHistory = (data: Record<string, TransactionHistoryItemType[]>) => {
  store.dispatch({ type: 'transactionHistory/update', payload: data });
};

export const subscribeTxHistory = lazySubscribeMessage('pri(transaction.history.getSubscription)', null, updateTxHistory, updateTxHistory);
