// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TransactionHistoryItem } from '@subwallet/extension-base/background/KoniTypes';
import { CRON_REFRESH_HISTORY_INTERVAL } from '@subwallet/extension-base/constants';
import { ChainService } from '@subwallet/extension-base/services/chain-service';
import DatabaseService from '@subwallet/extension-base/services/storage-service/DatabaseService';
import { accounts } from '@subwallet/ui-keyring/observable/accounts';
import { BehaviorSubject } from 'rxjs';

import { fetchMultiChainHistories } from './subsquid-multi-chain-history';

export class HistoryService {
  private dbService: DatabaseService;
  private chainService: ChainService;
  private historySubject: BehaviorSubject<TransactionHistoryItem[]> = new BehaviorSubject([] as TransactionHistoryItem[]);

  constructor (dbService: DatabaseService, chainService: ChainService) {
    this.dbService = dbService;
    this.chainService = chainService;

    // Create history interval and refresh it if changes accounts list
    this.refreshHistoryInterval();
    accounts.subject.subscribe(this.refreshHistoryInterval.bind(this));
  }

  private fetchPromise: Promise<TransactionHistoryItem[]> | null = null;
  private nextFetch: NodeJS.Timeout | undefined = undefined;
  private async fetchAndLoadHistories (addresses: string[]): Promise<TransactionHistoryItem[]> {
    const chainMap = this.chainService.getChainInfoMap();

    // Query data from subscan or any indexer
    const historyRecords = await fetchMultiChainHistories(addresses, chainMap);

    // Fill additional info
    const accountMap = Object.entries(accounts.subject.value).reduce((map, [address, account]) => {
      map[address.toLowerCase()] = account.json.meta.name || address;

      return map;
    }, {} as Record<string, string>);

    historyRecords.forEach((record) => {
      record.fromName = accountMap[record.from.toLowerCase()];
      record.toName = accountMap[record.to.toLowerCase()];
    });

    await this.dbService.upsertHistory(historyRecords);

    return await this.dbService.getHistories();
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
    const addressList = Object.keys(accounts.subject.value);

    if (!this.fetchPromise) {
      const historyRecords = await this.fetchHistories(addressList);

      this.historySubject.next(historyRecords);
    }

    return this.historySubject.getValue();
  }

  public async getHistorySubject () {
    await this.getHistories();

    return this.historySubject;
  }

  async insertHistory (historyItem: TransactionHistoryItem) {
    await this.dbService.upsertHistory([historyItem]);
    this.historySubject.next(await this.dbService.getHistories());
  }

  async updateHistory (chain: string, extrinsicHash: string, historyItem: Partial<TransactionHistoryItem>) {
    const existedRecords = await this.dbService.getHistories({ chain, extrinsicHash });
    const updatedRecords = existedRecords.map((r) => {
      return { ...r, ...historyItem };
    });

    await this.addHistoryItems(updatedRecords);
  }

  async addHistoryItems (historyItems: TransactionHistoryItem[]) {
    await this.dbService.upsertHistory(historyItems);
    this.historySubject.next(await this.dbService.getHistories());
  }
}
