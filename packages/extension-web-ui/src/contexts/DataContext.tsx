// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { persistor, store, StoreName } from '@subwallet/extension-web-ui/stores';
import { getDAppsData, getMissionPoolData, subscribeAccountsData, subscribeAddressBook, subscribeAssetLogoMaps, subscribeAssetRegistry, subscribeAssetSettings, subscribeAuthorizeRequests, subscribeAuthUrls, subscribeBalance, subscribeBuyServices, subscribeBuyTokens, subscribeChainInfoMap, subscribeChainLogoMaps, subscribeChainStateMap, subscribeChainStatusMap, subscribeConfirmationRequests, subscribeConnectWCRequests, subscribeCrowdloan, subscribeKeyringState, subscribeMantaPayConfig, subscribeMantaPaySyncingState, subscribeMetadataRequests, subscribeMultiChainAssetMap, subscribeNftCollections, subscribeNftItems, subscribePrice, subscribeProcessingCampaign, subscribeRewardHistory, subscribeSigningRequests, subscribeSwapPairs, subscribeTransactionRequests, subscribeTxHistory, subscribeUiSettings, subscribeWalletConnectSessions, subscribeWCNotSupportRequests, subscribeXcmRefMap, subscribeYieldMinAmountPercent, subscribeYieldPoolInfo, subscribeYieldPositionInfo, subscribeYieldReward } from '@subwallet/extension-web-ui/stores/utils';
import Bowser from 'bowser';
import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

interface DataContextProviderProps {
  children?: React.ReactElement;
}

export type DataMap = Record<StoreName, boolean>;

export interface DataHandler {
  name: string,
  unsub?: () => void,
  isSubscription?: boolean,
  start: () => void,
  isStarted?: boolean,
  isStartImmediately?: boolean,
  promise?: Promise<any>,
  relatedStores: StoreName[]
}

export interface DataContextType {
  handlerMap: Record<string, DataHandler>;
  storeDependencies: Partial<Record<StoreName, string[]>>;
  readyStoreMap: DataMap;

  addHandler: (item: DataHandler) => () => void;
  removeHandler: (name: string) => void;
  awaitRequestsCache: Record<string, Promise<boolean>>;
  awaitStores: (storeNames: StoreName[], renew?: boolean) => Promise<boolean>;
  awaitStartImmediately: () => Promise<boolean>;
}

const _DataContext: DataContextType = {
  handlerMap: {}, // Map to store data handlers
  storeDependencies: {}, // Map to store dependencies of each store
  awaitRequestsCache: {}, // Cache request promise to avoid rerender
  readyStoreMap: Object.keys(store.getState()).reduce((map, key) => {
    map[key as StoreName] = false; // Initialize each store to be not ready

    return map;
  }, {} as DataMap), // Convert the result to DataMap type
  addHandler: function (item: DataHandler) { // Add a new data handler
    const { name } = item;

    item.isSubscription = !!item.unsub; // Check if the handler has an unsubscribe function

    // If the handler doesn't exist in the map yet
    if (!this.handlerMap[name]) {
      this.handlerMap[name] = item; // Add the handler to the map
      item.relatedStores.forEach((storeName) => {
        // If the store doesn't have any dependencies yet
        if (!this.storeDependencies[storeName]) {
          this.storeDependencies[storeName] = []; // Initialize an empty array for the store's dependencies
        }

        // Add the handler to the store's dependencies
        this.storeDependencies[storeName]?.push(name);
      });

      // If the handler is set to start immediately
      if (item.isStartImmediately) {
        item.start(); // Start the handler
        item.isStarted = true; // Mark the handler as started
      }
    }

    // Return a function to remove the handler
    return () => {
      this.removeHandler(name);
    };
  },
  removeHandler: function (name: string) { // Remove a data handler
    const item = this.handlerMap[name];

    // If the handler doesn't exist in the map
    if (!item) {
      return; // Return without doing anything
    }

    // If the handler has an unsubscribe function, call it
    item.unsub && item.unsub();
    // Remove the handler from all the store's dependencies
    Object.values(this.storeDependencies).forEach((handlers) => {
      const removeIndex = handlers.indexOf(name);

      if (removeIndex >= 0) {
        handlers.splice(removeIndex, 1);
      }
    });

    // If the handler exists in the map, delete it
    if (this.handlerMap[name]) {
      delete this.handlerMap[name];
    }
  },
  awaitStores: function (storeNames: StoreName[], renew = false) {
    const key = storeNames.join('-');

    // Check await cache to avoid rerun many times
    if (!Object.hasOwnProperty.call(this.awaitRequestsCache, key) || renew) {
      const handlers = storeNames.reduce((acc, sName) => {
        (this.storeDependencies[sName] || []).forEach((handlerName) => {
          if (!acc.includes(handlerName)) {
            acc.push(handlerName);
          }
        });

        return acc;
      }, [] as string[]);

      // Create an array of promises from the handlers
      const promiseList = handlers.map((siName) => {
        const handler = this.handlerMap[siName];

        // Start the handler if it's not started or it's not a subscription and we want to renew
        if (!handler.isStarted || (!handler.isSubscription && renew)) {
          handler.start();

          handler.isStarted = true;
        }

        return handler.promise;
      });

      // Mark the store names as ready
      storeNames.forEach((n) => {
        this.readyStoreMap[n] = true;
      });

      this.awaitRequestsCache[key] = Promise.all(promiseList).then(() => true);
    }

    // Wait for all handlers to finish
    return this.awaitRequestsCache[key];
  },
  awaitStartImmediately: function () {
    const key = 'startImmediately';

    if (!Object.hasOwnProperty.call(this.awaitRequestsCache, key)) {
      const promiseList = Object.values(this.handlerMap).filter((handler) => handler.isStartImmediately).map((handler) => {
        return handler.promise;
      });

      this.awaitRequestsCache[key] = Promise.all(promiseList).then(() => true);
    }

    return this.awaitRequestsCache[key];
  }
};

export function initBasicData () {
  // Init Application with some default data if not existed
  const VARIANTS = ['beam', 'marble', 'pixel', 'sunset', 'bauhaus', 'ring'];

  function getRandomVariant (): string {
    const random = Math.floor(Math.random() * 6);

    return VARIANTS[random];
  }

  const browser = Bowser.getParser(window.navigator.userAgent);

  if (!window.localStorage.getItem('randomVariant') || !window.localStorage.getItem('randomNameForLogo')) {
    const randomVariant = getRandomVariant();

    window.localStorage.setItem('randomVariant', randomVariant);
    window.localStorage.setItem('randomNameForLogo', `${Date.now()}`);
  }

  if (!!browser.getBrowser() && !!browser.getBrowser().name && !!browser.getOS().name) {
    window.localStorage.setItem('browserInfo', browser.getBrowser().name as string);
    window.localStorage.setItem('osInfo', browser.getOS().name as string);
  }

  return true;
}

export const DataContext = React.createContext(_DataContext);

export const DataContextProvider = ({ children }: DataContextProviderProps) => {
  // Init basic data
  initBasicData();

  // Init subscription
  // Common
  _DataContext.addHandler({ ...subscribeAccountsData, name: 'subscribeAccountsData', relatedStores: ['accountState'], isStartImmediately: true });
  _DataContext.addHandler({ ...subscribeKeyringState, name: 'subscribeCurrentAccount', relatedStores: ['accountState'], isStartImmediately: true });
  _DataContext.addHandler({ ...subscribeAddressBook, name: 'subscribeAddressBook', relatedStores: ['accountState'], isStartImmediately: true });

  _DataContext.addHandler({ ...subscribeChainStateMap, name: 'subscribeChainStateMap', relatedStores: ['chainStore'], isStartImmediately: true });
  _DataContext.addHandler({ ...subscribeChainStatusMap, name: 'subscribeChainStatusMap', relatedStores: ['chainStore'], isStartImmediately: true });
  _DataContext.addHandler({ ...subscribeChainInfoMap, name: 'subscribeChainInfoMap', relatedStores: ['chainStore'], isStartImmediately: true });
  _DataContext.addHandler({ ...subscribeAssetRegistry, name: 'subscribeAssetRegistry', relatedStores: ['assetRegistry'], isStartImmediately: true });
  _DataContext.addHandler({ ...subscribeMultiChainAssetMap, name: 'subscribeMultiChainAssetMap', relatedStores: ['assetRegistry'], isStartImmediately: true });
  _DataContext.addHandler({ ...subscribeAssetSettings, name: 'subscribeAssetSettings', relatedStores: ['assetRegistry'], isStartImmediately: true });
  _DataContext.addHandler({ ...subscribeXcmRefMap, name: 'subscribeXcmRefMap', relatedStores: ['assetRegistry'], isStartImmediately: true });

  _DataContext.addHandler({ ...subscribeMantaPayConfig, name: 'subscribeMantaPayConfig', relatedStores: ['mantaPay'], isStartImmediately: true });
  _DataContext.addHandler({ ...subscribeMantaPaySyncingState, name: 'subscribeMantaPaySyncingState', relatedStores: ['mantaPay'], isStartImmediately: true });

  _DataContext.addHandler({ ...subscribeProcessingCampaign, name: 'subscribeProcessingCampaign', relatedStores: ['campaign'], isStartImmediately: true });

  _DataContext.addHandler({ ...subscribeBuyTokens, name: 'subscribeBuyTokens', relatedStores: ['buyService'], isStartImmediately: true });
  _DataContext.addHandler({ ...subscribeBuyServices, name: 'subscribeBuyServices', relatedStores: ['buyService'], isStartImmediately: true });

  // Settings
  _DataContext.addHandler({ ...subscribeUiSettings, name: 'subscribeUiSettings', relatedStores: ['settings'], isStartImmediately: true });
  _DataContext.addHandler({ ...subscribeChainLogoMaps, name: 'subscribeChainLogoMaps', relatedStores: ['settings'], isStartImmediately: true });
  _DataContext.addHandler({ ...subscribeAssetLogoMaps, name: 'subscribeAssetLogoMaps', relatedStores: ['settings'], isStartImmediately: true });
  _DataContext.addHandler({ ...subscribeAuthUrls, name: 'subscribeAuthUrls', relatedStores: ['settings'], isStartImmediately: true });

  // Confirmations
  _DataContext.addHandler({ ...subscribeAuthorizeRequests, name: 'subscribeAuthorizeRequests', relatedStores: ['requestState'], isStartImmediately: true });
  _DataContext.addHandler({ ...subscribeMetadataRequests, name: 'subscribeMetadataRequests', relatedStores: ['requestState'], isStartImmediately: true });
  _DataContext.addHandler({ ...subscribeSigningRequests, name: 'subscribeSigningRequests', relatedStores: ['requestState'], isStartImmediately: true });
  _DataContext.addHandler({ ...subscribeConfirmationRequests, name: 'subscribeConfirmationRequests', relatedStores: ['requestState'], isStartImmediately: true });
  _DataContext.addHandler({ ...subscribeTransactionRequests, name: 'subscribeTransactionRequests', relatedStores: ['requestState'], isStartImmediately: true });
  _DataContext.addHandler({ ...subscribeConnectWCRequests, name: 'subscribeConnectWCRequests', relatedStores: ['requestState'], isStartImmediately: true });
  _DataContext.addHandler({ ...subscribeWCNotSupportRequests, name: 'subscribeWCNotSupportRequests', relatedStores: ['requestState'], isStartImmediately: true });

  // Features
  _DataContext.addHandler({ ...subscribePrice, name: 'subscribePrice', relatedStores: ['price'] });
  _DataContext.addHandler({ ...subscribeBalance, name: 'subscribeBalance', relatedStores: ['balance'] });
  _DataContext.addHandler({ ...subscribeCrowdloan, name: 'subscribeCrowdloan', relatedStores: ['crowdloan'] });
  _DataContext.addHandler({ ...subscribeNftItems, name: 'subscribeNftItems', relatedStores: ['nft'] });
  _DataContext.addHandler({ ...subscribeNftCollections, name: 'subscribeNftCollections', relatedStores: ['nft'] });
  _DataContext.addHandler({ ...subscribeTxHistory, name: 'subscribeTxHistory', relatedStores: ['transactionHistory'] });
  _DataContext.addHandler({ ...subscribeWalletConnectSessions, name: 'subscribeWalletConnectSessions', relatedStores: ['walletConnect'] });
  _DataContext.addHandler({ ...getDAppsData, name: 'getDAppsData', relatedStores: ['dApp'], isStartImmediately: true });
  _DataContext.addHandler({ ...getMissionPoolData, name: 'getMissionPoolData', relatedStores: ['missionPool'], isStartImmediately: true });

  // Earning

  _DataContext.addHandler({ ...subscribeYieldPoolInfo, name: 'subscribeYieldPoolInfo', relatedStores: ['earning'] });
  _DataContext.addHandler({ ...subscribeYieldPositionInfo, name: 'subscribeYieldPositionInfo', relatedStores: ['earning'] });
  _DataContext.addHandler({ ...subscribeYieldReward, name: 'subscribeYieldReward', relatedStores: ['earning'] });
  _DataContext.addHandler({ ...subscribeRewardHistory, name: 'subscribeRewardHistory', relatedStores: ['earning'] });
  _DataContext.addHandler({ ...subscribeYieldMinAmountPercent, name: 'subscribeYieldMinAmountPercent', relatedStores: ['earning'] });

  // Swap
  _DataContext.addHandler({ ...subscribeSwapPairs, name: 'subscribeSwapPairs', relatedStores: ['swap'] });

  return <Provider store={store}>
    <PersistGate persistor={persistor}>
      <DataContext.Provider value={_DataContext}>
        {children}
      </DataContext.Provider>
    </PersistGate>
  </Provider>;
};
