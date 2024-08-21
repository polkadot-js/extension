// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ActiveCronAndSubscriptionMap, CronServiceType, MobileData, RequestCronAndSubscriptionAction, RequestInitCronAndSubscription, SubscriptionServiceType } from '@subwallet/extension-base/background/KoniTypes';
import { MessageTypes, RequestTypes, ResponseType } from '@subwallet/extension-base/background/types';
import { SWHandler } from '@subwallet/extension-base/koni/background/handlers/index';
import KoniState from '@subwallet/extension-base/koni/background/handlers/State';
import { SWStorage } from '@subwallet/extension-base/storage';
import { isSupportWindow, listMerge } from '@subwallet/extension-base/utils';
import { createPromiseHandler } from '@subwallet/extension-base/utils/promise';
import { DexieExportJsonStructure } from 'dexie-export-import';

export function isLocalStorageReset (): boolean {
  if (isSupportWindow && window?.localStorage) {
    return !window.localStorage.getItem('keyring:subwallet');
  } else {
    return false;
  }
}

export async function isIndexedDBReset (): Promise<boolean> {
  try {
    return (await SWHandler.instance.state.dbService.stores.migration.table.count()) < 1;
  } catch (e) {
    return true;
  }
}

// Detect problems on the web-runner
export async function isWebRunnerDataReset (): Promise<boolean> {
  return isLocalStorageReset() || await isIndexedDBReset();
}

const swStorage = SWStorage.instance;

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
  private lastRestoreData: {storage?: Record<string, string>, indexedDB?: DexieExportJsonStructure} = {};

  constructor (state: KoniState) {
    this.state = state;

    if (!isLocalStorageReset()) {
      swStorage.copy().then((data) => {
        this.lastRestoreData.storage = data;
      }).catch(console.error);
    }

    (async () => {
      if (!(await isIndexedDBReset())) {
        this.lastRestoreData.indexedDB = await state.dbService.getExportJson();
      }
    })().catch(console.error);
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

  private async _getLocalStorageExportData (): Promise<string> {
    await swStorage.waitReady;
    const storage = await swStorage.copy();

    return Promise.resolve(JSON.stringify(storage));
  }

  private async _getDexieExportData (): Promise<string> {
    const indexedDB = await this.state.dbService.exportDB();

    if (await isIndexedDBReset() && this.lastRestoreData.indexedDB) {
      // Merge with latest restore DexieData
      const exportData = await this.state.dbService.getExportJson();
      const exportTables = exportData?.data.data;
      const existedData = this.lastRestoreData.indexedDB;
      const existedTableMap = Object.fromEntries(existedData.data.data.map((table) => [table.tableName, table]));

      if (exportTables?.length > 0) {
        exportTables.forEach(({ inbound, rows, tableName }) => {
          const latestTable = existedTableMap[tableName];

          // chain & asset & campaign
          if (tableName === 'chain' || tableName === 'asset' || tableName === 'campaign') {
            latestTable.rows = listMerge('slug', latestTable.rows, rows);

            // Todo: Campaign still doesn't work
          } else if (tableName === 'migrations') {
            latestTable.rows = listMerge('key', latestTable.rows, rows);
          } else if (tableName === 'transactions') {
            latestTable.rows = listMerge(['chain', 'address', 'extrinsicHash'], latestTable.rows, rows);
          }
        });
      }

      return JSON.stringify(existedData);
    }

    return indexedDB;
  }

  public async mobileBackup (): Promise<MobileData> {
    const storage = await this._getLocalStorageExportData();
    const indexedDB = await this._getDexieExportData();

    return {
      storage,
      indexedDB
    };
  }

  public async mobileRestore ({ indexedDB, storage }: Partial<MobileData>): Promise<void> {
    if (storage) {
      const storageData = JSON.parse(storage) as Record<string, string>;

      for (const key in storageData) {
        await swStorage.setItem(key, storageData[key]);
      }
    }

    if (indexedDB) {
      // Backup the last restore data to memory
      this.lastRestoreData.indexedDB = JSON.parse(indexedDB) as DexieExportJsonStructure;
      // Backup the last restore data to memory
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
