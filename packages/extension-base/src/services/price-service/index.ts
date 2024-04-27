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
import { createPromiseHandler } from '@subwallet/extension-base/utils/promise';
import { staticData, StaticKey } from '@subwallet/extension-base/utils/staticData';
import { BehaviorSubject, merge } from 'rxjs';

const DEFAULT_CURRENCY: CurrencyType = 'USD';
const DEFAULT_PRICE_SUBJECT: PriceJson = { currency: DEFAULT_CURRENCY, ready: false, currencyData: { label: 'United States Dollar', symbol: DEFAULT_CURRENCY, isPrefix: true }, priceMap: {}, price24hMap: {}, exchangeRateMap: {} };

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
  private currency: BehaviorSubject<CurrencyType> = new BehaviorSubject(DEFAULT_CURRENCY);

  constructor (dbService: DatabaseService, eventService: EventService, chainService: ChainService) {
    this.currency.next(SWStorage.instance.getItem(CURRENCY) as CurrencyType || DEFAULT_CURRENCY);

    this.priceSubject = new BehaviorSubject({ ...DEFAULT_PRICE_SUBJECT, currency: this.currency.value });
    this.rawPriceSubject = new BehaviorSubject({} as Omit<PriceJson, 'exchangeRateMap'>);
    this.rawExchangeRateMap = new BehaviorSubject({} as Record<CurrencyType, ExchangeRateJSON>);
    this.status = ServiceStatus.NOT_INITIALIZED;
    this.dbService = dbService;
    this.eventService = eventService;
    this.chainService = chainService;

    const mergeDataSubject = merge(this.rawPriceSubject, this.rawExchangeRateMap, this.currency);

    mergeDataSubject.subscribe(() => {
      const priceSubjectValue = this.rawPriceSubject.value;
      const exchangeRateMapValue = this.rawExchangeRateMap.value;
      const currencyKey = this.currency.value;

      if (Object.keys(priceSubjectValue).length === 0) {
        return;
      }

      if (Object.keys(exchangeRateMapValue).length === 0) {
        return;
      }

      Object.keys(priceSubjectValue.price24hMap).forEach((key: string) => {
        priceSubjectValue.price24hMap[key] *= exchangeRateMapValue[currencyKey].exchange;
        priceSubjectValue.priceMap[key] *= exchangeRateMapValue[currencyKey].exchange;
      });

      this.priceSubject.next({ ...priceSubjectValue,
        currency: currencyKey,
        exchangeRateMap: exchangeRateMapValue,
        currencyData: staticData[StaticKey.CURRENCY_SYMBOL][currencyKey || DEFAULT_CURRENCY] as CurrencyJson });
      this.rawPriceSubject.next({} as Omit<PriceJson, 'exchangeRateMap'>);
      this.dbService.updatePriceStore({ ...priceSubjectValue, exchangeRateMap: exchangeRateMapValue }).catch(console.error);
    });

    this.init().catch(console.error);
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

  private async getExchangeRateMapItem () {
    try {
      const rs = await getExchangeRateMap();

      this.rawExchangeRateMap.next(rs);
    } catch (e) {
      console.log(e);
    }
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

  public setPriceCurrency (newCurrencyCode: CurrencyType, resolve: (rs: boolean) => void, reject: (e: boolean) => void) {
    const currency = this.currency.value;

    if (currency === newCurrencyCode) {
      reject(false);
    }

    this.getExchangeRateMapItem().then(() => {
      this.currency.next(newCurrencyCode);
      SWStorage.instance.setItem(CURRENCY, newCurrencyCode);
    }).catch(() => reject(false));

    this.priceSubject.subscribe((rs) => {
      if (rs.currency === newCurrencyCode) {
        resolve(true);
      }
    });
  }

  public refreshPriceData (priceIds?: Set<string>, resolve?: (rs: boolean) => void, reject?: (e: boolean) => void) {
    clearTimeout(this.refreshTimeout);
    this.priceIds = priceIds || this.getPriceIds();

    // Update for tokens price
    this.getTokenPrice(this.priceIds, this.priceSubject.value.currency)
      .then(() => {
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
