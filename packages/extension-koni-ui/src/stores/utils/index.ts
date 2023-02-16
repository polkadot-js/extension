// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo, _MultiChainAsset } from '@subwallet/chain-list/types';
import { AuthUrls } from '@subwallet/extension-base/background/handlers/State';
import { AccountsWithCurrentAddress, BalanceJson, ConfirmationsQueue, CrowdloanJson, KeyringState, NftCollection, NftJson, PriceJson, StakeUnlockingJson, StakingJson, StakingRewardJson, ThemeNames, TxHistoryItem } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson, AccountsContext, AuthorizeRequest, ConfirmationRequestBase, MetadataRequest, SigningRequest } from '@subwallet/extension-base/background/types';
import { _ChainState } from '@subwallet/extension-base/services/chain-service/types';
import { canDerive } from '@subwallet/extension-base/utils';
import { lazySubscribeMessage } from '@subwallet/extension-koni-ui/messaging';
import { store } from '@subwallet/extension-koni-ui/stores';
import { buildHierarchy } from '@subwallet/extension-koni-ui/util/buildHierarchy';

// Setup redux stores

// Base
// AccountState store
export const updateAccountData = (data: AccountsWithCurrentAddress | boolean) => {
  if (typeof data !== 'boolean') {
    let currentAccountJson: AccountJson = data.accounts[0];
    const accounts = data.accounts;

    accounts.forEach((accountJson) => {
      if (accountJson.address === data.currentAddress) {
        currentAccountJson = accountJson;
      }
    });

    const hierarchy = buildHierarchy(accounts);
    const master = hierarchy.find(({ isExternal, type }) => !isExternal && canDerive(type));

    updateCurrentAccountState(currentAccountJson);
    updateAccountsContext({
      accounts,
      hierarchy,
      master
    } as AccountsContext);
  }
};

export const updateCurrentAccountState = (currentAccountJson: AccountJson) => {
  store.dispatch({ type: 'accountState/updateCurrentAccount', payload: currentAccountJson });
};

export const updateAccountsContext = (data: AccountsContext) => {
  store.dispatch({ type: 'accountState/updateAccountsContext', payload: data });
};

export const subscribeAccountsData = lazySubscribeMessage('pri(accounts.subscribeWithCurrentAddress)', {}, updateAccountData, updateAccountData);

export const updateKeyringState = (data: KeyringState) => {
  store.dispatch({ type: 'accountState/updateKeyringState', payload: data });
};

export const subscribeKeyringState = lazySubscribeMessage('pri(keyring.subscribe)', null, updateKeyringState, updateKeyringState);

function convertConfirmationToMap (data: ConfirmationRequestBase[]) {
  return data.reduce((prev, request) => {
    prev[request.id] = request;

    return prev;
  }, {} as Record<string, ConfirmationRequestBase>);
}

export const updateAuthorizeRequests = (data: AuthorizeRequest[]) => {
  // Convert data to object with key as id
  const requests = convertConfirmationToMap(data);

  store.dispatch({ type: 'requestState/updateAuthorizeRequests', payload: requests });
};

export const subscribeAuthorizeRequests = lazySubscribeMessage('pri(authorize.requestsV2)', null, console.debug, updateAuthorizeRequests);

export const updateMetadataRequests = (data: MetadataRequest[]) => {
  // Convert data to object with key as id
  const requests = convertConfirmationToMap(data);

  store.dispatch({ type: 'requestState/updateMetadataRequests', payload: requests });
};

export const subscribeMetadataRequests = lazySubscribeMessage('pri(metadata.requests)', null, console.debug, updateMetadataRequests);

export const updateSigningRequests = (data: SigningRequest[]) => {
  // Convert data to object with key as id
  const requests = convertConfirmationToMap(data);

  store.dispatch({ type: 'requestState/updateSigningRequests', payload: requests });
};

export const subscribeSigningRequests = lazySubscribeMessage('pri(signing.requests)', null, console.debug, updateSigningRequests);

export const updateConfirmationRequests = (data: ConfirmationsQueue) => {
  store.dispatch({ type: 'requestState/updateConfirmationRequests', payload: data });
};

export const subscribeConfirmationRequests = lazySubscribeMessage('pri(confirmations.subscribe)', null, updateConfirmationRequests, updateConfirmationRequests);

// Settings Store
export const updateTheme = (theme: ThemeNames) => {
  store.dispatch({ type: 'settings/updateTheme', payload: theme });
};

export const updateShowZeroBalanceState = (isShow: boolean) => {
  store.dispatch({ type: 'settings/updateShowZeroBalanceState', payload: isShow });
};

// export const updateUiSettings = (data: AccountJson) => {
//   store.dispatch({ type: 'accountState/updateCurrentAccount', payload: data });
// };
//
// export const subscribeUiSettings = lazySubscribeMessage('pri(accounts.subscribeWithCurrentAddress)', {}, updateCurrentAccountState, updateCurrentAccountState);
//
// export const updateAppSettings = (data: AccountJson) => {
//   store.dispatch({ type: 'accountState/updateCurrentAccount', payload: data });
// };
//
// export const subscribeAppSettings = lazySubscribeMessage('pri(accounts.subscribeWithCurrentAddress)', {}, updateCurrentAccountState, updateCurrentAccountState);
//
export const updateAuthUrls = (data: AuthUrls) => {
  store.dispatch({ type: 'settings/updateAuthUrls', payload: data });
};

export const subscribeAuthUrls = lazySubscribeMessage('pri(authorize.subscribe)', null, updateAuthUrls, updateAuthUrls);

// export const updateMediaAllowance = (data: AccountJson) => {
//   store.dispatch({ type: 'accountState/updateCurrentAccount', payload: data });
// };
//
// export const subscribeMediaAllowance = lazySubscribeMessage('pri(accounts.subscribeWithCurrentAddress)', {}, updateCurrentAccountState, updateCurrentAccountState);

export const updateChainInfoMap = (data: Record<string, _ChainInfo>) => {
  store.dispatch({ type: 'chainStore/updateChainInfoMap', payload: data });
};

export const subscribeChainInfoMap = lazySubscribeMessage('pri(chainService.subscribeChainInfoMap)', null, updateChainInfoMap, updateChainInfoMap);

export const updateChainStateMap = (data: Record<string, _ChainState>) => {
  store.dispatch({ type: 'chainStore/updateChainStateMap', payload: data });
};

export const subscribeChainStateMap = lazySubscribeMessage('pri(chainService.subscribeChainStateMap)', null, updateChainStateMap, updateChainStateMap);

export const updateAssetRegistry = (data: Record<string, _ChainAsset>) => {
  store.dispatch({ type: 'assetRegistry/updateAssetRegistry', payload: data });
};

export const subscribeAssetRegistry = lazySubscribeMessage('pri(chainService.subscribeAssetRegistry)', null, updateAssetRegistry, updateAssetRegistry);

export const updateMultiChainAssetRegistry = (data: Record<string, _MultiChainAsset>) => {
  store.dispatch({ type: 'assetRegistry/updateMultiChainAssetMap', payload: data });
};

export const subscribeMultiChainAssetMap = lazySubscribeMessage('pri(chainService.subscribeMultiChainAssetMap)', null, updateMultiChainAssetRegistry, updateMultiChainAssetRegistry);

// Features
export const updatePrice = (data: PriceJson) => {
  store.dispatch({ type: 'price/updatePrice', payload: data });
};

export const subscribePrice = lazySubscribeMessage('pri(price.getSubscription)', null, updatePrice, updatePrice);

export const updateBalance = (data: BalanceJson) => {
  store.dispatch({ type: 'balance/update', payload: data.details });
};

export const subscribeBalance = lazySubscribeMessage('pri(balance.getSubscription)', null, updateBalance, updateBalance);

export const updateCrowdloan = (data: CrowdloanJson) => {
  store.dispatch({ type: 'crowdloan/update', payload: data.details });
};

export const subscribeCrowdloan = lazySubscribeMessage('pri(crowdloan.getSubscription)', null, updateCrowdloan, updateCrowdloan);

export const updateNftItems = (data: NftJson) => {
  store.dispatch({ type: 'nft/updateNftItems', payload: data.nftList });
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
  store.dispatch({ type: 'staking/updateStakingReward', payload: [...data.fastInterval, ...data.slowInterval] });
};

export const subscribeStakingReward = lazySubscribeMessage('pri(stakingReward.getSubscription)', null, updateStakingReward, updateStakingReward);

export const updateStakeUnlockingInfo = (data: StakeUnlockingJson) => {
  store.dispatch({ type: 'staking/updateStakeUnlockingInfo', payload: data.details });
};

export const subscribeStakeUnlockingInfo = lazySubscribeMessage('pri(unbonding.subscribeUnlockingInfo)', null, updateStakeUnlockingInfo, updateStakeUnlockingInfo);

export const updateTxHistory = (data: TxHistoryItem[]) => {
  store.dispatch({ type: 'transactionHistory/update', payload: data });
};

export const subscribeTxHistory = lazySubscribeMessage('pri(transaction.history.getSubscription)', null, updateTxHistory, updateTxHistory);
