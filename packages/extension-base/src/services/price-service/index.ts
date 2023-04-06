// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PriceJson } from '@subwallet/extension-base/background/KoniTypes';
import { CRON_REFRESH_PRICE_INTERVAL } from '@subwallet/extension-base/constants';
import { ChainService } from '@subwallet/extension-base/services/chain-service';
import { EventService } from '@subwallet/extension-base/services/event-service';
import { getTokenPrice } from '@subwallet/extension-base/services/price-service/coingecko';
import DatabaseService from '@subwallet/extension-base/services/storage-service/DatabaseService';
import { BehaviorSubject } from 'rxjs';

const DEFAULT_PRICE_SUBJECT: PriceJson = { ready: false, currency: 'usd', priceMap: {}, price24hMap: {} };

export class PriceService {
  private dbService: DatabaseService;
  private eventService: EventService;
  private chainService: ChainService;
  private priceSubject: BehaviorSubject<PriceJson> = new BehaviorSubject(DEFAULT_PRICE_SUBJECT);
  private refreshTimeout: NodeJS.Timeout | undefined;
  private priceIds = new Set<string>();

  constructor (dbService: DatabaseService, eventService: EventService, chainService: ChainService) {
    this.dbService = dbService;
    this.eventService = eventService;
    this.chainService = chainService;

    // Fetch data from storage
    this.getPrice().catch(console.error);

    const eventHandler = () => {
      const newPriceIds = this.getPriceIds();

      // Compare two set newPriceIds and this.priceIds
      if (newPriceIds.size !== this.priceIds.size || !Array.from(newPriceIds).every((v) => this.priceIds.has(v))) {
        this.priceIds = newPriceIds;
        this.refreshPriceData(this.priceIds);
      }
    };

    this.eventService.waitAssetReady
      .then(() => {
        this.refreshPriceData();

        this.eventService.on('asset.enable', eventHandler);
        this.eventService.on('asset.add', eventHandler);
      }).catch(console.error);
  }

  async getPrice () {
    const isReady = this.priceSubject.value.ready;

    if (!isReady) {
      const data = await this.dbService.getPriceStore();

      this.priceSubject.next(data || DEFAULT_PRICE_SUBJECT);
    }

    return this.priceSubject.value;
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

  public refreshPriceData (priceIds?: Set<string>) {
    clearTimeout(this.refreshTimeout);
    console.log('Refresh Price Data');

    this.priceIds = priceIds || this.getPriceIds();

    // Update for tokens price
    getTokenPrice(this.priceIds)
      .then((rs) => {
        this.priceSubject.next({ ...rs, ready: true });
        this.dbService.updatePriceStore(rs).catch(console.error);

        console.log('Get Token Price From CoinGecko');
      })
      .catch(console.error);

    this.refreshTimeout = setTimeout(this.refreshPriceData.bind(this), CRON_REFRESH_PRICE_INTERVAL);
  }
}
