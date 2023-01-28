// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { lazySubscribeMessage } from '@subwallet/extension-koni-ui/messaging';
import { store, StoreName } from '@subwallet/extension-koni-ui/stores';
import React from 'react';
import { Provider } from 'react-redux';
import {PriceJson} from "@subwallet/extension-base/background/KoniTypes";

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
  subscriptionMap: Record<string, DataHandler>,
  storeSubscriptions: Partial<Record<StoreName, string[]>>,
  readyStoreMap: DataMap

  addHandler: (item: DataHandler) => () => void,
  removeHandler: (name: string) => void,
  awaitStores: (storeNames: StoreName[], renew?: boolean) => Promise<boolean>
}

const _DataContext: DataContextType = {
  subscriptionMap: {},
  storeSubscriptions: {},
  readyStoreMap: Object.keys(store.getState()).reduce((map, key) => {
    map[key as StoreName] = false;

    return map;
  }, {} as DataMap),
  addHandler: function (item: DataHandler) {
    const { name } = item;

    item.isSubscription = !!item.unsub;

    if (!this.subscriptionMap[name]) {
      this.subscriptionMap[name] = item;

      item.relatedStores.forEach((storeName) => {
        if (!this.storeSubscriptions[storeName]) {
          this.storeSubscriptions[storeName] = [];
        }

        this.storeSubscriptions[storeName]?.push(name);
      });

      if (item.isStartImmediately) {
        item.start();
        item.isStarted = true;
      }
    }

    return () => {
      this.removeHandler(name);
    };
  },
  removeHandler: function (name: string) {
    const item = this.subscriptionMap[name];

    if (!item) {
      return;
    }

    item.unsub && item.unsub();
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
  awaitStores: async function (storeNames: StoreName[], renew = true) {
    const promiseList = storeNames.reduce((handlers, sName) => {
      (this.storeSubscriptions[sName] || []).forEach((handlerName) => {
        if (!handlers.includes(handlerName)) {
          handlers.push(handlerName);
        }
      });

      return handlers;
    }, [] as string[]).map((siName) => {
      const handler = this.subscriptionMap[siName];

      if (!handler.isStarted || (!handler.isSubscription && renew)) {
        handler.start();
        handler.isStarted = true;
      }

      return handler.promise;
    });

    storeNames.forEach((n) => {
      this.readyStoreMap[n] = true;
    });

    await Promise.all(promiseList);

    return true;
  }
};

export const DataContext = React.createContext(_DataContext);

const updatePrice = (data: PriceJson) => {
  store.dispatch({ type: 'price/update', payload: data });
};

const subscribePrice = lazySubscribeMessage('pri(price.getSubscription)', null, updatePrice, updatePrice);

export const DataContextProvider = ({ children }: DataContextProviderProps) => {
  // Init subscription
  _DataContext.addHandler({ ...subscribePrice, name: 'subscribePrice', relatedStores: ['price'] });

  return <Provider store={store}>
    <DataContext.Provider value={_DataContext}>
      {children}
    </DataContext.Provider>
  </Provider>;
};
