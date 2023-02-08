// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { persistor,store, StoreName } from '@subwallet/extension-koni-ui/stores';
import { subscribeAccountsData, subscribeAssetRegistry, subscribeBalance, subscribeChainInfoMap, subscribeChainStateMap, subscribeCrowdloan, subscribeKeyringState, subscribeNftCollections, subscribeNftItems, subscribePrice, subscribeStakeUnlockingInfo, subscribeStaking, subscribeStakingReward, subscribeTxHistory } from '@subwallet/extension-koni-ui/stores/utils';
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
  handlerMap: Record<string, DataHandler>,
  storeDependencies: Partial<Record<StoreName, string[]>>,
  readyStoreMap: DataMap

  addHandler: (item: DataHandler) => () => void,
  removeHandler: (name: string) => void,
  awaitStores: (storeNames: StoreName[], renew?: boolean) => Promise<boolean>
}

const _DataContext: DataContextType = {
  handlerMap: {}, // Map to store data handlers
  storeDependencies: {}, // Map to store dependencies of each store
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
  awaitStores: async function (storeNames: StoreName[], renew = true) {
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

    // Wait for all handlers to finish
    await Promise.all(promiseList);

    return true;
  }
};

export const DataContext = React.createContext(_DataContext);

export const DataContextProvider = ({ children }: DataContextProviderProps) => {
  // Init subscription
  // Common
  _DataContext.addHandler({ ...subscribeAccountsData, name: 'subscribeCurrentAccount', relatedStores: ['accountState'], isStartImmediately: true });
  _DataContext.addHandler({ ...subscribeKeyringState, name: 'subscribeCurrentAccount', relatedStores: ['accountState'], isStartImmediately: true });

  _DataContext.addHandler({ ...subscribeChainStateMap, name: 'subscribeChainStateMap', relatedStores: ['chainStore'], isStartImmediately: true });
  _DataContext.addHandler({ ...subscribeChainInfoMap, name: 'subscribeChainInfoMap', relatedStores: ['chainStore'], isStartImmediately: true });
  _DataContext.addHandler({ ...subscribeAssetRegistry, name: 'subscribeAssetRegistry', relatedStores: ['assetRegistry'], isStartImmediately: true });

  // Features
  _DataContext.addHandler({ ...subscribePrice, name: 'subscribePrice', relatedStores: ['price'] });
  _DataContext.addHandler({ ...subscribeBalance, name: 'subscribeBalance', relatedStores: ['balance'] });
  _DataContext.addHandler({ ...subscribeCrowdloan, name: 'subscribeCrowdloan', relatedStores: ['crowdloan'] });
  _DataContext.addHandler({ ...subscribeNftItems, name: 'subscribeNftItems', relatedStores: ['nft'] });
  _DataContext.addHandler({ ...subscribeNftCollections, name: 'subscribeNftCollections', relatedStores: ['nft'] });
  _DataContext.addHandler({ ...subscribeStaking, name: 'subscribeStaking', relatedStores: ['staking'] });
  _DataContext.addHandler({ ...subscribeStakingReward, name: 'subscribeStakingReward', relatedStores: ['staking'] });
  _DataContext.addHandler({ ...subscribeStakeUnlockingInfo, name: 'subscribeStakeUnlockingInfo', relatedStores: ['staking'] });
  _DataContext.addHandler({ ...subscribeTxHistory, name: 'subscribeTxHistory', relatedStores: ['transactionHistory'] });

  return <Provider store={store}>
    <PersistGate persistor={persistor}>
      <DataContext.Provider value={_DataContext}>
        {children}
      </DataContext.Provider>
    </PersistGate>
  </Provider>;
};
