// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CurrencyJson, CurrencyType, ExchangeRateJSON, PriceJson } from '@subwallet/extension-base/background/KoniTypes';
import { CRON_REFRESH_PRICE_INTERVAL, CURRENCY } from '@subwallet/extension-base/constants';
import { CronServiceInterface, PersistDataServiceInterface, ServiceStatus, StoppableServiceInterface } from '@subwallet/extension-base/services/base/types';
import { ChainService } from '@subwallet/extension-base/services/chain-service';
import { EventService } from '@subwallet/extension-base/services/event-service';
import { getExchangeRateMap, getPriceMap } from '@subwallet/extension-base/services/price-service/coingecko';
import DatabaseService from '@subwallet/extension-base/services/storage-service/DatabaseService';
import { SWStorage } from '@subwallet/extension-base/storage';
import { CurrentCurrencyStore } from '@subwallet/extension-base/stores';
import { createPromiseHandler } from '@subwallet/extension-base/utils/promise';
import { staticData, StaticKey } from '@subwallet/extension-base/utils/staticData';
import { BehaviorSubject, Subject } from 'rxjs';

const DEFAULT_CURRENCY: CurrencyType = 'USD';
const DEFAULT_PRICE_SUBJECT: PriceJson = {
  currency: DEFAULT_CURRENCY,
  ready: false,
  currencyData: { label: 'United States Dollar', symbol: DEFAULT_CURRENCY, isPrefix: true },
  priceMap: {},
  price24hMap: {},
  exchangeRateMap: {}
};

export class PriceService implements StoppableServiceInterface, PersistDataServiceInterface, CronServiceInterface {
  status: ServiceStatus;
  private dbService: DatabaseService;
  private eventService: EventService;
  private chainService: ChainService;
  private priceSubject: BehaviorSubject<PriceJson>;
  private rawPriceSubject: BehaviorSubject<Omit<PriceJson, 'exchangeRateMap'>>;
  private rawExchangeRateMap: BehaviorSubject<Record<CurrencyType, ExchangeRateJSON>>;
  private refreshTimeout: NodeJS.Timeout | undefined;
  private priceIds = new Set<string>();
  private readonly currency = new CurrentCurrencyStore();

  constructor (dbService: DatabaseService, eventService: EventService, chainService: ChainService) {
    this.priceSubject = new BehaviorSubject({ ...DEFAULT_PRICE_SUBJECT });
    this.rawPriceSubject = new BehaviorSubject({} as Omit<PriceJson, 'exchangeRateMap'>);
    this.rawExchangeRateMap = new BehaviorSubject({} as Record<CurrencyType, ExchangeRateJSON>);
    this.status = ServiceStatus.NOT_INITIALIZED;
    this.dbService = dbService;
    this.eventService = eventService;
    this.chainService = chainService;

    const updateCurrency = (currentCurrency: CurrencyType) => {
      const currency = SWStorage.instance.getItem(CURRENCY) as CurrencyType;

      this.setCurrentCurrency(currency || currentCurrency || DEFAULT_CURRENCY);
    };

    this.init().then(
      () => this.getCurrentCurrency(updateCurrency)
    ).catch(console.error);
  }

  private async getTokenPrice (priceIds: Set<string>, currency?: CurrencyType, resolve?: (rs: boolean) => void, reject?: (e: boolean) => void) {
    await Promise.all([
      getExchangeRateMap(),
      getPriceMap(priceIds, currency)
    ]).then(([exchangeRateMap, priceMap]) => {
      this.rawExchangeRateMap.next(exchangeRateMap);
      this.rawPriceSubject.next(priceMap);
    });
  }

  private getCurrentCurrencySubject (): Subject<CurrencyType> {
    return this.currency.getSubject();
  }

  private setCurrentCurrency (currency: CurrencyType) {
    this.currency.set('Currency', currency);
  }

  private getCurrentCurrency (update: (value: CurrencyType) => void): void {
    this.currency.get('Currency', (value) => {
      update(value || DEFAULT_CURRENCY);
    });
  }

  private refreshPromise: Promise<void> | null = null;
  private refreshPriceMapByAction () {
    this.refreshPromise = (async () => {
      try {
        await this.refreshPromise;
        const { promise, resolve } = createPromiseHandler<CurrencyType>();

        this.getCurrentCurrency(resolve);

        const currencyKey = await promise;

        const newPriceMap = await this.calculatePriceMap(currencyKey || DEFAULT_CURRENCY);

        if (newPriceMap) {
          this.priceSubject.next(newPriceMap);
        }
      } catch (e) {
        console.error(e);
      } finally {
        this.refreshPromise = null;
      }
    })();
  }

  private async calculatePriceMap (currency?: CurrencyType) {
    const { price24hMap, priceMap } = this.rawPriceSubject.value;
    const exchangeRateData = this.rawExchangeRateMap.value;
    const currencyKey = currency || DEFAULT_CURRENCY;

    if (Object.keys(exchangeRateData).length === 0) {
      return;
    }

    const finalPriceMap = {
      priceMap: { ...priceMap },
      price24hMap: { ...price24hMap },
      currency: currencyKey,
      exchangeRateMap: exchangeRateData,
      currencyData: staticData[StaticKey.CURRENCY_SYMBOL][currencyKey || DEFAULT_CURRENCY] as CurrencyJson
    };

    if (currencyKey === DEFAULT_CURRENCY) {
      return finalPriceMap;
    }

    Object.keys(finalPriceMap.price24hMap).forEach((key: string) => {
      finalPriceMap.price24hMap[key] *= exchangeRateData[currencyKey].exchange;
      finalPriceMap.priceMap[key] *= exchangeRateData[currencyKey].exchange;
    });

    await this.dbService.updatePriceStore(finalPriceMap);

    return finalPriceMap;
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

  public async setPriceCurrency (newCurrencyCode: CurrencyType) {
    this.setCurrentCurrency(newCurrencyCode);

    // Await 1s to get the latest exchange rate
    await new Promise((resolve) => setTimeout(resolve, 300));

    SWStorage.instance.setItem(CURRENCY, newCurrencyCode);

    return true;
  }

  public refreshPriceData (priceIds?: Set<string>) {
    clearTimeout(this.refreshTimeout);
    this.priceIds = priceIds || this.getPriceIds();

    // Update for tokens price
    this.getTokenPrice(this.priceIds, DEFAULT_CURRENCY)
      .then(() => {
        this.refreshPriceMapByAction();
      })
      .catch((e) => {
        console.error(e);
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
        this.refreshPriceMapByAction();
      }
    };

    this.getCurrentCurrencySubject().subscribe((currency) => {
      console.log('Currency changed', currency);
      this.calculatePriceMap(currency).then((data) => {
        if (data) {
          this.priceSubject.next(data);
        }
      }).catch(console.error);
    });

    this.status = ServiceStatus.INITIALIZED;

    this.eventService.on('asset.updateState', eventHandler);
  }

  async loadData (): Promise<void> {
    const data = await this.dbService.getPriceStore(this.priceSubject.value.currency);

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
