// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ActiveCronAndSubscriptionMap, CronServiceType, MobileData, RequestCronAndSubscriptionAction, RequestInitCronAndSubscription, SubscriptionServiceType } from '@subwallet/extension-base/background/KoniTypes';
import { MessageTypes, RequestTypes, ResponseType } from '@subwallet/extension-base/background/types';
import KoniState from '@subwallet/extension-base/koni/background/handlers/State';
import { createPromiseHandler } from '@subwallet/extension-base/utils/promise';

const DEFAULT_SERVICE_MAP = {
  subscription: {
    chainRegistry: true,
    balance: true,
    crowdloan: true,
    staking: true
  },
  cron: {
    price: true,
    nft: true,
    staking: true,
    history: true,
    recoverApi: true,
    checkApiStatus: true
  }
};

export default class Mobile {
  // @ts-ignore
  private state: KoniState;
  private restoreHandler = createPromiseHandler<void>();

  constructor (state: KoniState) {
    this.state = state;
  }

  public ping (): string {
    return 'mobile:ping';
  }

  public initCronAndSubscription (
    { cron: { activeServices: activeCronServices, intervalMap: cronIntervalMap },
      subscription: { activeServices: activeSubscriptionServices } }: RequestInitCronAndSubscription): ActiveCronAndSubscriptionMap {
    console.log('initCronAndSubscription');

    return {
      subscription: {
        chainRegistry: true,
        balance: true,
        crowdloan: true,
        staking: true
      },
      cron: {
        price: true,
        nft: true,
        staking: true,
        history: true,
        recoverApi: true,
        checkApiStatus: true
      }
    };
  }

  public subscribeActiveCronAndSubscriptionServiceMap (id: string, port: chrome.runtime.Port): ActiveCronAndSubscriptionMap {
    return DEFAULT_SERVICE_MAP;
  }

  public startCronAndSubscriptionServices ({ cronServices, subscriptionServices }: RequestCronAndSubscriptionAction): void {
    console.log('startCronAndSubscriptionServices');
  }

  public stopCronAndSubscriptionServices ({ cronServices, subscriptionServices }: RequestCronAndSubscriptionAction): void {
    console.log('stopCronAndSubscriptionServices');
  }

  public restartCronAndSubscriptionServices ({ cronServices, subscriptionServices }: RequestCronAndSubscriptionAction): void {
    console.log('restartCronAndSubscriptionServices');
  }

  public startCronServices (services: CronServiceType[]): void {
    console.log('startCronServices');
  }

  public stopCronServices (services: CronServiceType[]): void {
    console.log('stopCronServices');
  }

  public restartCronServices (services: CronServiceType[]): void {
    console.log('stopCronServices');
  }

  public startSubscriptionServices (services: SubscriptionServiceType[]): void {
    console.log('startSubscriptionServices');
  }

  public stopSubscriptionServices (services: SubscriptionServiceType[]): void {
    console.log('stopSubscriptionServices');
  }

  public restartSubscriptionServices (services: SubscriptionServiceType[]): void {
    console.log('restartSubscriptionServices');
  }

  public async mobileBackup (): Promise<MobileData> {
    const indexedDB = await this.state.dbService.exportDB();

    return {
      storage: JSON.stringify(localStorage),
      indexedDB
    };
  }

  public async mobileRestore ({ indexedDB, storage }: Partial<MobileData>): Promise<void> {
    if (storage) {
      const storageData = JSON.parse(storage) as Record<string, any>;

      for (const key in storageData) {
        localStorage.setItem(key, JSON.stringify(storageData[key]));
      }
    }

    if (indexedDB) {
      await this.state.dbService.importDB(indexedDB);
    }

    this.restoreHandler.resolve();
  }

  public waitRestore (): Promise<void> {
    return this.restoreHandler.promise;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async handle<TMessageType extends MessageTypes> (
    id: string,
    type: TMessageType,
    request: RequestTypes[TMessageType],
    port: chrome.runtime.Port): Promise<ResponseType<TMessageType>> {
    switch (type) {
      case 'mobile(ping)':
        return this.ping();
      case 'mobile(cronAndSubscription.init)':
        return this.initCronAndSubscription(request as RequestInitCronAndSubscription);
      case 'mobile(cronAndSubscription.activeService.subscribe)':
        return this.subscribeActiveCronAndSubscriptionServiceMap(id, port);
      case 'mobile(cronAndSubscription.start)':
        return this.startCronAndSubscriptionServices(request as RequestCronAndSubscriptionAction);
      case 'mobile(cronAndSubscription.stop)':
        return this.stopCronAndSubscriptionServices(request as RequestCronAndSubscriptionAction);
      case 'mobile(cronAndSubscription.restart)':
        return this.restartCronAndSubscriptionServices(request as RequestCronAndSubscriptionAction);
      case 'mobile(cron.start)':
        return this.startCronServices(request as CronServiceType[]);
      case 'mobile(cron.stop)':
        return this.stopCronServices(request as CronServiceType[]);
      case 'mobile(cron.restart)':
        return this.restartCronServices(request as CronServiceType[]);
      case 'mobile(subscription.start)':
        return this.startSubscriptionServices(request as SubscriptionServiceType[]);
      case 'mobile(subscription.stop)':
        return this.stopSubscriptionServices(request as SubscriptionServiceType[]);
      case 'mobile(subscription.restart)':
        return this.restartSubscriptionServices(request as SubscriptionServiceType[]);
      case 'mobile(storage.restore)':
        return this.mobileRestore(request as MobileData);
      case 'mobile(storage.backup)':
        return this.mobileBackup();
      default:
        throw new Error(`Unable to handle message of type ${type}`);
    }
  }
}
