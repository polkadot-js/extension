// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { subscribePrice } from '@subwallet/extension-koni-ui/messaging';
import { store, StoreName } from '@subwallet/extension-koni-ui/stores';
import React from 'react';

interface DataContextProviderProps {
  children?: React.ReactElement;
}

export type DataMap = Record<StoreName, boolean>;

export interface SubscriptionItem {
  name: string,
  subscription: () => Promise<void>,
  promise?: Promise<void>,
  relatedStores: StoreName[]
}

export interface DataContextType {
  subscriptionMap: Record<string, SubscriptionItem>,
  storeSubscriptions: Partial<Record<StoreName, string[]>>,
  readyStoreMap: DataMap

  addSubscription: (name: string, subscription: () => Promise<void>, relatedStores: StoreName[]) => void,
  removeSubscription: (name: string) => void,
  awaitData: (storeNames: StoreName[]) => Promise<boolean>
}

const _DataContext: DataContextType = {
  subscriptionMap: {},
  storeSubscriptions: {},
  readyStoreMap: Object.keys(store.getState()).reduce((map, key) => {
    map[key as StoreName] = false;

    return map;
  }, {} as DataMap),
  addSubscription: function (name: string, subscription: () => Promise<void>, relatedStores: StoreName[]) {
    if (this.subscriptionMap[name]) {
      return;
    }

    this.subscriptionMap[name] = {
      name,
      subscription,
      relatedStores
    };

    relatedStores.forEach((storeName) => {
      if (!this.storeSubscriptions[storeName]) {
        this.storeSubscriptions[storeName] = [];
      }

      this.storeSubscriptions[storeName]?.push(name);
    });

    return () => {
      this.removeSubscription(name);
    };
  },
  removeSubscription: function (name: string) {
    Object.values(this.storeSubscriptions).forEach((subscriptions) => {
      const removeIndex = subscriptions.indexOf(name);

      if (removeIndex >= 0) {
        subscriptions.splice(removeIndex, 1);
      }
    });

    if (this.subscriptionMap[name]) {
      delete this.subscriptionMap[name];
    }
  },
  awaitData: async function (storeNames: StoreName[]) {
    const promiseList = storeNames.reduce((subList, sName) => {
      (this.storeSubscriptions[sName] || []).forEach((siName) => {
        if (!subList.includes(siName)) {
          subList.push(siName);
        }
      });

      return subList;
    }, [] as string[]).map((siName) => {
      const subscriptionItem = this.subscriptionMap[siName];

      if (!subscriptionItem.promise) {
        subscriptionItem.promise = new Promise((resolve, reject) => {
          subscriptionItem.subscription().then(resolve).catch(reject);
        });
      }

      return subscriptionItem.promise;
    });

    storeNames.forEach((n) => {
      this.readyStoreMap[n] = true;
    });

    await Promise.all(promiseList);

    return true;
  }
};

export const DataContext = React.createContext(_DataContext);

export const DataContextProvider = ({ children }: DataContextProviderProps) => {
  // Init subscription
  _DataContext.addSubscription('price', async () => {
    await subscribePrice(null, (data) => {
      console.log(data);
    }).then((data) => {
      console.log(data);
    }).catch(console.error);
  }, ['price']);

  return <DataContext.Provider value={_DataContext}>
    {children}
  </DataContext.Provider>;
};
