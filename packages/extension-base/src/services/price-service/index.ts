// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PriceJson } from '@subwallet/extension-base/background/KoniTypes';
import { CRON_REFRESH_PRICE_INTERVAL } from '@subwallet/extension-base/constants';
import { CronServiceInterface, PersistDataServiceInterface, ServiceStatus, StoppableServiceInterface } from '@subwallet/extension-base/services/base/types';
import { ChainService } from '@subwallet/extension-base/services/chain-service';
import { EventService } from '@subwallet/extension-base/services/event-service';
import { getTokenPrice } from '@subwallet/extension-base/services/price-service/coingecko';
import DatabaseService from '@subwallet/extension-base/services/storage-service/DatabaseService';
import { createPromiseHandler } from '@subwallet/extension-base/utils/promise';
import { BehaviorSubject } from 'rxjs';

const DEFAULT_PRICE_SUBJECT: PriceJson = { currencyCode: 'USD', ready: false, currency: { label: 'United States Dollar', symbol: '$', isPrefix: true }, priceMap: {}, price24hMap: {}, exchangeRateMap: {} };

export class PriceService implements StoppableServiceInterface, PersistDataServiceInterface, CronServiceInterface {
  status: ServiceStatus;
  private dbService: DatabaseService;
  private eventService: EventService;
  private chainService: ChainService;
  private priceSubject: BehaviorSubject<PriceJson> = new BehaviorSubject(DEFAULT_PRICE_SUBJECT);
  private refreshTimeout: NodeJS.Timeout | undefined;
  private priceIds = new Set<string>();

  constructor (dbService: DatabaseService, eventService: EventService, chainService: ChainService) {
    this.status = ServiceStatus.NOT_INITIALIZED;
    this.dbService = dbService;
    this.eventService = eventService;
    this.chainService = chainService;

    this.init().catch(console.error);
  }

  async getPrice () {
    return Promise.resolve(this.priceSubject.value);
  }

  public getPriceSubject () {
    return this.priceSubject;
  }

  public getPriceIds () {
    const priceIdList = Object.values(this.chainService.getAssetRegistry())
      .map((a) => a.priceId)
      .filter((a) => a) as string[];

    return new Set(priceIdList);
  }

  public setPriceCurrency (currency: string, resolve: (rs: boolean) => void, reject: (e: boolean) => void) {
    const { currencyCode, exchangeRateMap } = this.getPriceSubject().value;

    if (currencyCode === currency) {
      reject(false);

      return;
    }

    if (!exchangeRateMap[currency]) {
      reject(false);

      return;
    }

    this.refreshPriceData(undefined, currency, resolve, reject);
  }

  public refreshPriceData (priceIds?: Set<string>, currency?: string, resolve?: (rs: boolean) => void, reject?: (e: boolean) => void) {
    clearTimeout(this.refreshTimeout);
    this.priceIds = priceIds || this.getPriceIds();

    // Update for tokens price
    getTokenPrice(this.priceIds, currency || this.priceSubject.value.currencyCode)
      .then((rs) => {
        this.priceSubject.next({ ...rs, ready: true });
        this.dbService.updatePriceStore(rs).catch(console.error);
        resolve && resolve(true);
      })
      .catch((e) => {
        console.error(e);
        reject && reject(false);
      });

    this.refreshTimeout = setTimeout(this.refreshPriceData.bind(this), CRON_REFRESH_PRICE_INTERVAL);
  }

  async init (): Promise<void> {
    this.status = ServiceStatus.INITIALIZING;
    // Fetch data from storage
    await this.loadData();

    const eventHandler = () => {
      const newPriceIds = this.getPriceIds();

      // Compare two set newPriceIds and this.priceIds
      if (newPriceIds.size !== this.priceIds.size || !Array.from(newPriceIds).every((v) => this.priceIds.has(v))) {
        this.priceIds = newPriceIds;
        this.refreshPriceData(this.priceIds);
      }
    };

    this.status = ServiceStatus.INITIALIZED;

    this.eventService.on('asset.updateState', eventHandler);
  }

  async loadData (): Promise<void> {
    const data = await this.dbService.getPriceStore();

    this.priceSubject.next(data || DEFAULT_PRICE_SUBJECT);
  }

  async persistData (): Promise<void> {
    await this.dbService.updatePriceStore(this.priceSubject.value).catch(console.error);
  }

  startPromiseHandler = createPromiseHandler<void>();
  async start (): Promise<void> {
    if (this.status === ServiceStatus.STARTED) {
      return;
    }

    try {
      await this.eventService.waitAssetReady;
      this.startPromiseHandler = createPromiseHandler<void>();
      this.status = ServiceStatus.STARTING;
      await this.startCron();
      this.status = ServiceStatus.STARTED;
      this.startPromiseHandler.resolve();
    } catch (e) {
      this.startPromiseHandler.reject(e);
    }
  }

  async startCron (): Promise<void> {
    this.refreshPriceData();

    return Promise.resolve();
  }

  stopPromiseHandler = createPromiseHandler<void>();
  async stop (): Promise<void> {
    try {
      this.status = ServiceStatus.STOPPING;
      this.stopPromiseHandler = createPromiseHandler<void>();
      await this.stopCron();
      await this.persistData();
      this.status = ServiceStatus.STOPPED;
      this.stopPromiseHandler.resolve();
    } catch (e) {
      this.stopPromiseHandler.reject(e);
    }
  }

  stopCron (): Promise<void> {
    clearTimeout(this.refreshTimeout);

    return Promise.resolve(undefined);
  }

  waitForStarted (): Promise<void> {
    return this.startPromiseHandler.promise;
  }

  waitForStopped (): Promise<void> {
    return this.stopPromiseHandler.promise;
  }
}
