// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { TransactionHistoryItem } from '@subwallet/extension-base/background/KoniTypes';
import { CRON_REFRESH_HISTORY_INTERVAL } from '@subwallet/extension-base/constants';
import { ChainService } from '@subwallet/extension-base/services/chain-service';
import { EventService } from '@subwallet/extension-base/services/event-service';
import DatabaseService from '@subwallet/extension-base/services/storage-service/DatabaseService';
import { quickFormatAddressToCompare } from '@subwallet/extension-base/utils/address';
import { keyring } from '@subwallet/ui-keyring';
import { accounts } from '@subwallet/ui-keyring/observable/accounts';
import { BehaviorSubject } from 'rxjs';

import { fetchMultiChainHistories } from './subsquid-multi-chain-history';

export class HistoryService {
  private dbService: DatabaseService;
  private chainService: ChainService;
  private eventService: EventService;
  private historySubject: BehaviorSubject<TransactionHistoryItem[]> = new BehaviorSubject([] as TransactionHistoryItem[]);

  constructor (dbService: DatabaseService, chainService: ChainService, eventService: EventService) {
    this.dbService = dbService;
    this.chainService = chainService;
    this.eventService = eventService;

    // Load history from database
    this.dbService.getHistories().then((histories) => {
      this.historySubject.next(histories);
    }).catch(console.error);

    // Wait for keyring and chain ready and start
    Promise.all([this.eventService.waitKeyringReady, this.eventService.waitChainReady]).then(() => {
      this.getHistories().catch(console.log);

      this.eventService.on('account.add', (address) => {
        this.refreshHistoryInterval();
      });
      this.eventService.on('account.remove', (address) => {
        this.removeHistoryByAddress(address).catch(console.error);
      });
    }).catch(console.error);
  }

  private fetchPromise: Promise<TransactionHistoryItem[]> | null = null;
  private nextFetch: NodeJS.Timeout | undefined = undefined;
  private async fetchAndLoadHistories (addresses: string[]): Promise<TransactionHistoryItem[]> {
    if (!addresses || addresses.length === 0) {
      return [];
    }

    const chainMap = this.chainService.getChainInfoMap();

    // Query data from subscan or any indexer
    const historyRecords = await fetchMultiChainHistories(addresses, chainMap);

    // Fill additional info
    const accountMap = Object.entries(accounts.subject.value).reduce((map, [address, account]) => {
      map[address.toLowerCase()] = account.json.meta.name || address;

      return map;
    }, {} as Record<string, string>);

    historyRecords.forEach((record) => {
      record.fromName = accountMap[record.from?.toLowerCase()];
      record.toName = accountMap[record.to?.toLowerCase()];
    });

    this.dbService.upsertHistory(historyRecords).catch(console.error);

    return historyRecords;
  }

  public async fetchHistories (addresses: string[]) {
    if (!this.fetchPromise) {
      // Fetch another histories data data indexer and merge it with stored in database
      this.fetchPromise = this.fetchAndLoadHistories(addresses);
    }

    return this.fetchPromise;
  }

  public invalidCache () {
    this.fetchPromise = null;
  }

  public refreshHistoryInterval () {
    clearTimeout(this.nextFetch);
    this.invalidCache();
    this.getHistories().catch(console.error);

    this.nextFetch = setTimeout(this.refreshHistoryInterval.bind(this), CRON_REFRESH_HISTORY_INTERVAL);
  }

  public async getHistories () {
    const addressList = keyring.getAccounts().map((a) => a.address);
    const currentHistories = this.historySubject.value;

    if (!this.fetchPromise || currentHistories.length === 0) {
      const historyRecords = await this.fetchHistories(addressList);

      this.historySubject.next(historyRecords);
    }

    return this.historySubject.getValue();
  }

  public async getHistorySubject () {
    await this.getHistories();

    return this.historySubject;
  }

  async insertHistories (historyItems: TransactionHistoryItem[]) {
    await this.dbService.upsertHistory(historyItems);
    this.historySubject.next(await this.dbService.getHistories());
  }

  async updateHistories (chain: string, extrinsicHash: string, updateData: Partial<TransactionHistoryItem>) {
    const existedRecords = await this.dbService.getHistories({ chain, extrinsicHash });
    const updatedRecords = existedRecords.map((r) => {
      return { ...r, ...updateData };
    });

    await this.addHistoryItems(updatedRecords);
  }

  async addHistoryItems (historyItems: TransactionHistoryItem[]) {
    // Prevent override record with original is 'app'
    const appRecords = this.historySubject.value.filter((item) => item.origin === 'app');
    const excludeKeys = appRecords.map((item) => {
      return `${item.chain}-${quickFormatAddressToCompare(item.address) || ''}-${item.extrinsicHash}`;
    });

    const updateRecords = historyItems.filter((item) => {
      const key = `${item.chain}-${quickFormatAddressToCompare(item.address) || ''}-${item.extrinsicHash}`;

      return item.origin === 'app' || !excludeKeys.includes(key);
    });

    await this.dbService.upsertHistory(updateRecords);
    this.historySubject.next(await this.dbService.getHistories());
  }

  async removeHistoryByAddress (address: string) {
    await this.dbService.stores.transaction.removeAllByAddress(address);
    this.historySubject.next(await this.dbService.getHistories());
  }
}
