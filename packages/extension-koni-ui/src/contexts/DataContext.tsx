// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { store, StoreName } from '@subwallet/extension-koni-ui/stores';
import { subscribeAssetRegistry, subscribeBalance, subscribeChainInfoMap, subscribeChainStateMap, subscribeCrowdloan, subscribeNftCollections, subscribeNftItems, subscribePrice, subscribeStakeUnlockingInfo, subscribeStaking, subscribeStakingReward, subscribeTxHistory } from '@subwallet/extension-koni-ui/stores/utils';
import React from 'react';
import { Provider } from 'react-redux';

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
  handlerMap: {},
  storeDependencies: {},
  readyStoreMap: Object.keys(store.getState()).reduce((map, key) => {
    map[key as StoreName] = false;

    return map;
  }, {} as DataMap),
  addHandler: function (item: DataHandler) {
    const { name } = item;

    item.isSubscription = !!item.unsub;

    if (!this.handlerMap[name]) {
      this.handlerMap[name] = item;

      item.relatedStores.forEach((storeName) => {
        if (!this.storeDependencies[storeName]) {
          this.storeDependencies[storeName] = [];
        }

        this.storeDependencies[storeName]?.push(name);
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
    const item = this.handlerMap[name];

    if (!item) {
      return;
    }

    item.unsub && item.unsub();
    Object.values(this.storeDependencies).forEach((handlers) => {
      const removeIndex = handlers.indexOf(name);

      if (removeIndex >= 0) {
        handlers.splice(removeIndex, 1);
      }
    });

    if (this.handlerMap[name]) {
      delete this.handlerMap[name];
    }
  },
  awaitStores: async function (storeNames: StoreName[], renew = true) {
    const promiseList = storeNames.reduce((handlers, sName) => {
      (this.storeDependencies[sName] || []).forEach((handlerName) => {
        if (!handlers.includes(handlerName)) {
          handlers.push(handlerName);
        }
      });

      return handlers;
    }, [] as string[]).map((siName) => {
      const handler = this.handlerMap[siName];

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

export const DataContextProvider = ({ children }: DataContextProviderProps) => {
  // Init subscription
  // Common
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
    <DataContext.Provider value={_DataContext}>
      {children}
    </DataContext.Provider>
  </Provider>;
};
