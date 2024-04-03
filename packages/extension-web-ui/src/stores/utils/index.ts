// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _AssetRef, _ChainAsset, _ChainInfo, _MultiChainAsset } from '@subwallet/chain-list/types';
import { AuthUrls } from '@subwallet/extension-base/background/handlers/State';
import { AccountsWithCurrentAddress, AddressBookInfo, AssetSetting, CampaignBanner, ChainStakingMetadata, ConfirmationsQueue, CrowdloanJson, KeyringState, MantaPayConfig, MantaPaySyncState, NftCollection, NftJson, NominatorMetadata, PriceJson, StakingJson, StakingRewardJson, TransactionHistoryItem, UiSettings } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson, AccountsContext, AuthorizeRequest, ConfirmationRequestBase, MetadataRequest, SigningRequest } from '@subwallet/extension-base/background/types';
import { _ChainApiStatus, _ChainState } from '@subwallet/extension-base/services/chain-service/types';
import { SWTransactionResult } from '@subwallet/extension-base/services/transaction-service/types';
import { WalletConnectNotSupportRequest, WalletConnectSessionRequest } from '@subwallet/extension-base/services/wallet-connect-service/types';
import { BalanceJson, BuyServiceInfo, BuyTokenInfo, EarningRewardHistoryItem, EarningRewardJson, YieldPoolInfo, YieldPositionInfo } from '@subwallet/extension-base/types';
import { SwapPair } from '@subwallet/extension-base/types/swap';
import { addLazy, canDerive, fetchStaticData, isEmptyObject } from '@subwallet/extension-base/utils';
import { lazySubscribeMessage } from '@subwallet/extension-web-ui/messaging';
import { store } from '@subwallet/extension-web-ui/stores';
import { DAppCategory, DAppInfo } from '@subwallet/extension-web-ui/types/dapp';
import { MissionInfo } from '@subwallet/extension-web-ui/types/missionPool';
import { buildHierarchy } from '@subwallet/extension-web-ui/utils/account/buildHierarchy';
import { SessionTypes } from '@walletconnect/types';

// Setup redux stores

// Base
// AccountState store
export const updateAccountData = (data: AccountsWithCurrentAddress) => {
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
};

export const updateCurrentAccountState = (currentAccountJson: AccountJson) => {
  store.dispatch({ type: 'accountState/updateCurrentAccount', payload: currentAccountJson });
};

export const updateAccountsContext = (data: AccountsContext) => {
  addLazy('updateAccountsContext', () => {
    store.dispatch({ type: 'accountState/updateAccountsContext', payload: data });
  }, 300, 2400);
};

export const subscribeAccountsData = lazySubscribeMessage('pri(accounts.subscribeWithCurrentAddress)', {}, updateAccountData, updateAccountData);

export const updateKeyringState = (data: KeyringState) => {
  addLazy('updateKeyringState', () => {
    store.dispatch({ type: 'accountState/updateKeyringState', payload: data });
  }, 300, 2400);
};

export const subscribeKeyringState = lazySubscribeMessage('pri(keyring.subscribe)', null, updateKeyringState, updateKeyringState);

export const updateAddressBook = (data: AddressBookInfo) => {
  store.dispatch({ type: 'accountState/updateAddressBook', payload: data });
};

export const subscribeAddressBook = lazySubscribeMessage('pri(accounts.subscribeAddresses)', null, updateAddressBook, updateAddressBook);

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

export const subscribeAuthorizeRequests = lazySubscribeMessage('pri(authorize.requestsV2)', null, updateAuthorizeRequests, updateAuthorizeRequests);

export const updateMetadataRequests = (data: MetadataRequest[]) => {
  // Convert data to object with key as id
  const requests = convertConfirmationToMap(data);

  store.dispatch({ type: 'requestState/updateMetadataRequests', payload: requests });
};

export const subscribeMetadataRequests = lazySubscribeMessage('pri(metadata.requests)', null, updateMetadataRequests, updateMetadataRequests);

export const updateSigningRequests = (data: SigningRequest[]) => {
  // Convert data to object with key as id
  const requests = convertConfirmationToMap(data);

  store.dispatch({ type: 'requestState/updateSigningRequests', payload: requests });
};

export const subscribeSigningRequests = lazySubscribeMessage('pri(signing.requests)', null, updateSigningRequests, updateSigningRequests);

export const updateConfirmationRequests = (data: ConfirmationsQueue) => {
  store.dispatch({ type: 'requestState/updateConfirmationRequests', payload: data });
};

export const subscribeConfirmationRequests = lazySubscribeMessage('pri(confirmations.subscribe)', null, updateConfirmationRequests, updateConfirmationRequests);

export const updateTransactionRequests = (data: Record<string, SWTransactionResult>) => {
  // Convert data to object with key as id

  store.dispatch({ type: 'requestState/updateTransactionRequests', payload: data });
};

export const subscribeTransactionRequests = lazySubscribeMessage('pri(transactions.subscribe)', null, updateTransactionRequests, updateTransactionRequests);

// Settings Store

export const updateUiSettings = (data: UiSettings) => {
  store.dispatch({ type: 'settings/updateUiSettings', payload: data });
};

export const subscribeUiSettings = lazySubscribeMessage('pri(settings.subscribe)', null, updateUiSettings, updateUiSettings);

export const updateChainLogoMaps = (data: Record<string, string>) => {
  addLazy('updateChainLogoMaps', () => {
    store.dispatch({ type: 'settings/updateChainLogoMaps', payload: data });
  }, 100, 300, false);
};

export const subscribeChainLogoMaps = lazySubscribeMessage('pri(settings.logo.chains.subscribe)', null, updateChainLogoMaps, updateChainLogoMaps);

export const updateAssetLogoMaps = (data: Record<string, string>) => {
  addLazy('updateAssetLogoMaps', () => {
    store.dispatch({ type: 'settings/updateAssetLogoMaps', payload: data });
  }, 100, 300, false);
};

export const subscribeAssetLogoMaps = lazySubscribeMessage('pri(settings.logo.assets.subscribe)', null, updateAssetLogoMaps, updateAssetLogoMaps);

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
  !isEmptyObject(data) && addLazy('updateChainStateMap', () => {
    store.dispatch({ type: 'chainStore/updateChainStateMap', payload: data });
  }, 600, 1800);
};

export const subscribeChainStateMap = lazySubscribeMessage('pri(chainService.subscribeChainStateMap)', null, updateChainStateMap, updateChainStateMap);

export const updateChainStatusMap = (data: Record<string, _ChainApiStatus>) => {
  store.dispatch({ type: 'chainStore/updateChainStatusMap', payload: data });
};

export const subscribeChainStatusMap = lazySubscribeMessage('pri(chainService.subscribeChainStatusMap)', null, updateChainStatusMap, updateChainStatusMap);

export const updateAssetRegistry = (data: Record<string, _ChainAsset>) => {
  // TODO useTokenGroup
  store.dispatch({ type: 'assetRegistry/updateAssetRegistry', payload: data });
};

export const subscribeAssetRegistry = lazySubscribeMessage('pri(chainService.subscribeAssetRegistry)', null, updateAssetRegistry, updateAssetRegistry);

export const updateMultiChainAssetRegistry = (data: Record<string, _MultiChainAsset>) => {
  store.dispatch({ type: 'assetRegistry/updateMultiChainAssetMap', payload: data });
};

export const subscribeMultiChainAssetMap = lazySubscribeMessage('pri(chainService.subscribeMultiChainAssetMap)', null, updateMultiChainAssetRegistry, updateMultiChainAssetRegistry);

export const updateXcmRefMap = (data: Record<string, _AssetRef>) => {
  store.dispatch({ type: 'assetRegistry/updateXcmRefMap', payload: data });
};

export const subscribeXcmRefMap = lazySubscribeMessage('pri(chainService.subscribeXcmRefMap)', null, updateXcmRefMap, updateXcmRefMap);

export const updateAssetSettingMap = (data: Record<string, AssetSetting>) => {
  store.dispatch({ type: 'assetRegistry/updateAssetSettingMap', payload: data });
};

export const subscribeAssetSettings = lazySubscribeMessage('pri(assetSetting.getSubscription)', null, updateAssetSettingMap, updateAssetSettingMap);

// Features
export const updatePrice = (data: PriceJson) => {
  store.dispatch({ type: 'price/updatePrice', payload: data });
};

export const subscribePrice = lazySubscribeMessage('pri(price.getSubscription)', null, updatePrice, updatePrice);

export const updateBalance = (data: BalanceJson) => {
  !isEmptyObject(data.details) && addLazy('updateBalance', () => {
    store.dispatch({ type: 'balance/update', payload: data.details });
  }, 600, 1800);
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

export const updateStakingReward = (stakingRewardJson: StakingRewardJson) => {
  store.dispatch({ type: 'staking/updateStakingReward', payload: Object.values(stakingRewardJson.data) });
};

export const subscribeStakingReward = lazySubscribeMessage('pri(stakingReward.getSubscription)', null, updateStakingReward, updateStakingReward);

export const updateChainStakingMetadata = (data: ChainStakingMetadata[]) => {
  store.dispatch({ type: 'staking/updateChainStakingMetadata', payload: data });
};

export const subscribeChainStakingMetadata = lazySubscribeMessage('pri(bonding.subscribeChainStakingMetadata)', null, updateChainStakingMetadata, updateChainStakingMetadata);

export const updateStakingNominatorMetadata = (data: NominatorMetadata[]) => {
  store.dispatch({ type: 'staking/updateNominatorMetadata', payload: data });
};

export const subscribeStakingNominatorMetadata = lazySubscribeMessage('pri(bonding.subscribeNominatorMetadata)', null, updateStakingNominatorMetadata, updateStakingNominatorMetadata);

export const updateTxHistory = (data: TransactionHistoryItem[]) => {
  addLazy('updateTxHistory', () => {
    store.dispatch({ type: 'transactionHistory/update', payload: data });
  });
};

export const subscribeTxHistory = lazySubscribeMessage('pri(transaction.history.getSubscription)', null, updateTxHistory, updateTxHistory);

export const updateMantaPayConfig = (data: MantaPayConfig[]) => {
  store.dispatch({ type: 'mantaPay/updateConfig', payload: data });
};

export const subscribeMantaPayConfig = lazySubscribeMessage('pri(mantaPay.subscribeConfig)', null, updateMantaPayConfig, updateMantaPayConfig);

export const updateMantaPaySyncing = (data: MantaPaySyncState) => {
  store.dispatch({ type: 'mantaPay/updateIsSyncing', payload: data });
};

export const subscribeMantaPaySyncingState = lazySubscribeMessage('pri(mantaPay.subscribeSyncingState)', null, updateMantaPaySyncing, updateMantaPaySyncing);

// export const updateChainValidators = (data: ChainValidatorParams) => {
//   store.dispatch({ type: 'bonding/updateChainValidators', payload: data });
// };
//
// export const subscribeChainValidators = lazySubscribeMessage('pri(bonding.getBondingOptions)', null, updateChainValidators, updateChainValidators);

/* Wallet connect */

export const updateConnectWCRequests = (data: WalletConnectSessionRequest[]) => {
  // Convert data to object with key as id
  const requests = convertConfirmationToMap(data);

  store.dispatch({ type: 'requestState/updateConnectWCRequests', payload: requests });
};

export const subscribeConnectWCRequests = lazySubscribeMessage('pri(walletConnect.requests.connect.subscribe)', null, updateConnectWCRequests, updateConnectWCRequests);

export const updateWalletConnectSessions = (data: SessionTypes.Struct[]) => {
  const payload: Record<string, SessionTypes.Struct> = {};

  data.forEach((session) => {
    payload[session.topic] = session;
  });
  store.dispatch({ type: 'walletConnect/updateSessions', payload: payload });
};

export const subscribeWalletConnectSessions = lazySubscribeMessage('pri(walletConnect.session.subscribe)', null, updateWalletConnectSessions, updateWalletConnectSessions);

export const updateWCNotSupportRequests = (data: WalletConnectNotSupportRequest[]) => {
  // Convert data to object with key as id
  const requests = convertConfirmationToMap(data);

  store.dispatch({ type: 'requestState/updateWCNotSupportRequests', payload: requests });
};

export const subscribeWCNotSupportRequests = lazySubscribeMessage('pri(walletConnect.requests.notSupport.subscribe)', null, updateWCNotSupportRequests, updateWCNotSupportRequests);

export const updateDAppStore = (dApps: DAppInfo[], categories: DAppCategory[]) => {
  const featureDApps: DAppInfo[] = dApps.filter((i) => i.is_featured);

  store.dispatch({ type: 'dApp/update',
    payload: {
      categories,
      featureDApps,
      dApps
    } });
};

export const getDAppsData = (() => {
  const handler: {
    resolve?: (value: unknown[]) => void,
    reject?: (reason?: any) => void
  } = {};

  const promise = new Promise<any[]>((resolve, reject) => {
    handler.resolve = resolve;
    handler.reject = reject;
  });

  const rs = {
    promise,
    start: () => {
      Promise.all([
        fetchStaticData<DAppInfo[]>('dapps'),
        fetchStaticData<DAppCategory[]>('categories')
      ])
        .then((data) => {
          handler.resolve?.(data);
        })
        .catch(handler.reject);
    }
  };

  rs.promise.then((data) => {
    updateDAppStore(data[0] as DAppInfo[], data[1] as DAppCategory[]);
  }).catch(console.error);

  return rs;
})();

export const updateMissionPoolStore = (missions: MissionInfo[]) => {
  store.dispatch({ type: 'missionPool/update',
    payload: {
      missions
    } });
};

export const getMissionPoolData = (() => {
  const handler: {
    resolve?: (value: unknown[]) => void,
    reject?: (reason?: any) => void
  } = {};

  const promise = new Promise<any[]>((resolve, reject) => {
    handler.resolve = resolve;
    handler.reject = reject;
  });

  const rs = {
    promise,
    start: () => {
      fetchStaticData<MissionInfo[]>('airdrop-campaigns')
        .then((data) => {
          handler.resolve?.(data);
        })
        .catch(handler.reject);
    }
  };

  rs.promise.then((data) => {
    updateMissionPoolStore(data as MissionInfo[]);
  }).catch(console.error);

  return rs;
})();

/* Campaign */
export const updateBanner = (data: CampaignBanner[]) => {
  const filtered = data.filter((item) => !item.isDone);

  store.dispatch({ type: 'campaign/updateBanner', payload: filtered });
};

export const subscribeProcessingCampaign = lazySubscribeMessage('pri(campaign.banner.subscribe)', null, updateBanner, updateBanner);
/* Campaign */

/* Buy service */
export const updateBuyTokens = (data: Record<string, BuyTokenInfo>) => {
  store.dispatch({ type: 'buyService/updateBuyTokens', payload: data });
};

export const subscribeBuyTokens = lazySubscribeMessage('pri(buyService.tokens.subscribe)', null, updateBuyTokens, updateBuyTokens);

export const updateBuyServices = (data: Record<string, BuyServiceInfo>) => {
  store.dispatch({ type: 'buyService/updateBuyServices', payload: data });
};

export const subscribeBuyServices = lazySubscribeMessage('pri(buyService.services.subscribe)', null, updateBuyServices, updateBuyServices);
/* Buy service */

/* Earning */

export const updateYieldPoolInfo = (data: YieldPoolInfo[]) => {
  addLazy(
    'updateYieldPoolInfo',
    () => {
      store.dispatch({ type: 'earning/updateYieldPoolInfo', payload: data });
    },
    900
  );
};

export const subscribeYieldPoolInfo = lazySubscribeMessage(
  'pri(yield.subscribePoolInfo)',
  null,
  updateYieldPoolInfo,
  updateYieldPoolInfo
);

export const updateYieldPositionInfo = (data: YieldPositionInfo[]) => {
  addLazy(
    'updateYieldPositionInfo',
    () => {
      store.dispatch({ type: 'earning/updateYieldPositionInfo', payload: data });
    },
    900
  );
};

export const subscribeYieldPositionInfo = lazySubscribeMessage(
  'pri(yield.subscribeYieldPosition)',
  null,
  updateYieldPositionInfo,
  updateYieldPositionInfo
);

export const updateYieldReward = (data: EarningRewardJson) => {
  addLazy(
    'updateYieldReward',
    () => {
      store.dispatch({ type: 'earning/updateYieldReward', payload: Object.values(data.data) });
    },
    900
  );
};

export const subscribeYieldReward = lazySubscribeMessage(
  'pri(yield.subscribeYieldReward)',
  null,
  updateYieldReward,
  updateYieldReward
);

export const updateRewardHistory = (data: Record<string, EarningRewardHistoryItem>) => {
  if (Object.keys(data).length > 0) {
    addLazy(
      'updateRewardHistory',
      () => {
        store.dispatch({ type: 'earning/updateRewardHistory', payload: Object.values(data) });
      },
      900
    );
  }
};

export const subscribeRewardHistory = lazySubscribeMessage(
  'pri(yield.subscribeRewardHistory)',
  null,
  updateRewardHistory,
  updateRewardHistory
);

export const updateMinAmountPercent = (data: Record<string, number>) => {
  store.dispatch({ type: 'earning/updateMinAmountPercent', payload: data });
};

export const subscribeYieldMinAmountPercent = lazySubscribeMessage(
  'pri(yield.minAmountPercent)',
  null,
  updateMinAmountPercent,
  updateMinAmountPercent
);

/* Earning */

/* Swap */
export const updateSwapPairs = (data: SwapPair[]) => {
  store.dispatch({ type: 'swap/updateSwapPairs', payload: data });
};

export const subscribeSwapPairs = lazySubscribeMessage('pri(swapService.subscribePairs)', null, updateSwapPairs, updateSwapPairs);
/* Swap */
