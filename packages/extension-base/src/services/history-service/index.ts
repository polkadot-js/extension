// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { TransactionHistoryItem } from '@subwallet/extension-base/background/KoniTypes';
import { CRON_REFRESH_HISTORY_INTERVAL } from '@subwallet/extension-base/constants';
import { CronServiceInterface, PersistDataServiceInterface, ServiceStatus, StoppableServiceInterface } from '@subwallet/extension-base/services/base/types';
import { ChainService } from '@subwallet/extension-base/services/chain-service';
import { EventService } from '@subwallet/extension-base/services/event-service';
import { KeyringService } from '@subwallet/extension-base/services/keyring-service';
import DatabaseService from '@subwallet/extension-base/services/storage-service/DatabaseService';
import { createPromiseHandler } from '@subwallet/extension-base/utils/promise';
import { keyring } from '@subwallet/ui-keyring';
import { BehaviorSubject } from 'rxjs';

import { fetchMultiChainHistories } from './subsquid-multi-chain-history';

export class HistoryService implements StoppableServiceInterface, PersistDataServiceInterface, CronServiceInterface {
  private historySubject: BehaviorSubject<TransactionHistoryItem[]> = new BehaviorSubject([] as TransactionHistoryItem[]);

  constructor (private dbService: DatabaseService, private chainService: ChainService, private eventService: EventService, private keyringService: KeyringService) {
    this.init().catch(console.error);
  }

  private fetchPromise: Promise<void> | null = null;
  private interval: NodeJS.Timer | undefined = undefined;
  private async fetchAndLoadHistories (addresses: string[]): Promise<TransactionHistoryItem[]> {
    if (!addresses || addresses.length === 0) {
      return [];
    }

    const chainMap = this.chainService.getChainInfoMap();

    // Query data from subscan or any indexer
    const historyRecords = await fetchMultiChainHistories(addresses, chainMap);

    // Fill additional info
    const accountMap = Object.entries(this.keyringService.accounts).reduce((map, [address, account]) => {
      map[address.toLowerCase()] = account.json.meta.name || address;

      return map;
    }, {} as Record<string, string>);

    historyRecords.forEach((record) => {
      record.fromName = accountMap[record.from?.toLowerCase()];
      record.toName = accountMap[record.to?.toLowerCase()];
    });

    await this.addHistoryItems(historyRecords);

    return historyRecords;
  }

  public async getHistories () {
    const addressList = keyring.getAccounts().map((a) => a.address);

    if (!this.fetchPromise) {
      this.fetchPromise = (async () => {
        await this.fetchAndLoadHistories(addressList);
        const histories = await this.dbService.getHistories();

        this.historySubject.next(histories);
      })();
    }

    return Promise.resolve(this.historySubject.getValue());
  }

  public async getHistorySubject () {
    await this.getHistories();

    return this.historySubject;
  }

  async updateHistories (chain: string, extrinsicHash: string, updateData: Partial<TransactionHistoryItem>) {
    const existedRecords = await this.dbService.getHistories({ chain, extrinsicHash });
    const updatedRecords = existedRecords.map((r) => {
      return { ...r, ...updateData };
    });

    await this.addHistoryItems(updatedRecords);
  }

  async updateHistoryByExtrinsicHash (extrinsicHash: string, updateData: Partial<TransactionHistoryItem>) {
    await this.dbService.updateHistoryByNewExtrinsicHash(extrinsicHash, updateData);
    this.historySubject.next(await this.dbService.getHistories());
  }

  // Insert history without check override origin 'app'
  async insertHistories (historyItems: TransactionHistoryItem[]) {
    await this.dbService.upsertHistory(historyItems);
    this.historySubject.next(await this.dbService.getHistories());
  }

  // Insert history with check override origin 'app'
  async addHistoryItems (historyItems: TransactionHistoryItem[]) {
    // Prevent override record with original is 'app'
    const appRecords = this.historySubject.value.filter((item) => item.origin === 'app');
    const excludeKeys = appRecords.map((item) => {
      return `${item.chain}-${item.extrinsicHash}`;
    });

    const updateRecords = historyItems.filter((item) => {
      const key = `${item.chain}-${item.extrinsicHash}`;

      // !excludeKeys.includes(key) && console.log('Cancel update', key);

      return item.origin === 'app' || !excludeKeys.includes(key);
    });

    await this.dbService.upsertHistory(updateRecords);
    this.historySubject.next(await this.dbService.getHistories());
  }

  async removeHistoryByAddress (address: string) {
    await this.dbService.stores.transaction.removeAllByAddress(address);
    this.historySubject.next(await this.dbService.getHistories());
  }

  status: ServiceStatus = ServiceStatus.NOT_INITIALIZED;

  async loadData (): Promise<void> {
    const histories = await this.dbService.getHistories();

    this.historySubject.next(histories);
  }

  async persistData (): Promise<void> {
    await this.dbService.upsertHistory(this.historySubject.value);
  }

  async startCron (): Promise<void> {
    await this.getHistories();

    this.interval = setInterval(() => {
      this.getHistories().catch(console.error);
    }, CRON_REFRESH_HISTORY_INTERVAL);
  }

  stopCron (): Promise<void> {
    clearTimeout(this.interval);
    this.fetchPromise = null;

    return Promise.resolve();
  }

  startPromiseHandler = createPromiseHandler<void>();

  async init (): Promise<void> {
    this.status = ServiceStatus.INITIALIZING;
    await this.loadData();
    Promise.all([this.eventService.waitKeyringReady, this.eventService.waitChainReady]).then(() => {
      this.getHistories().catch(console.log);

      this.eventService.on('account.add', () => {
        (async () => {
          await this.stopCron();
          await this.startCron();
        })().catch(console.error);
      });
      this.eventService.on('account.remove', (address) => {
        this.removeHistoryByAddress(address).catch(console.error);
      });
    }).catch(console.error);
    this.status = ServiceStatus.INITIALIZED;
  }

  async start (): Promise<void> {
    try {
      console.debug('Start history service');
      this.startPromiseHandler = createPromiseHandler<void>();
      this.status = ServiceStatus.STARTING;
      await this.startCron();
      this.status = ServiceStatus.STARTED;
      this.startPromiseHandler.resolve();
    } catch (e) {
      this.startPromiseHandler.reject(e);
    }
  }

  waitForStarted () {
    return this.startPromiseHandler.promise;
  }

  stopPromiseHandler = createPromiseHandler<void>();
  async stop (): Promise<void> {
    console.debug('Stop history service');

    try {
      this.stopPromiseHandler = createPromiseHandler<void>();
      this.status = ServiceStatus.STOPPING;
      await this.persistData();
      await this.stopCron();
      this.stopPromiseHandler.resolve();
      this.status = ServiceStatus.STOPPED;
    } catch (e) {
      this.stopPromiseHandler.reject(e);
    }
  }

  waitForStopped () {
    return this.stopPromiseHandler.promise;
  }
}
