// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BUY_SERVICE_CONTACT_URL, BUY_TOKEN_URL } from '@subwallet/extension-base/constants';
import KoniState from '@subwallet/extension-base/koni/background/handlers/State';
import { ListBuyServicesResponse, ListBuyTokenResponse } from '@subwallet/extension-base/services/buy-service/types';
import { BuyServiceInfo, BuyTokenInfo, SupportService } from '@subwallet/extension-base/types';
import axios from 'axios';
import { BehaviorSubject } from 'rxjs';

import { DEFAULT_SERVICE_INFO } from './constants';

export default class BuyService {
  readonly #state: KoniState;

  private buyTokensSubject = new BehaviorSubject<Record<string, BuyTokenInfo>>({});
  private buyServicesSubject = new BehaviorSubject<Record<string, BuyServiceInfo>>({});

  constructor (state: KoniState) {
    this.#state = state;

    this.buyTokensSubject.next({});
    this.buyServicesSubject.next({});

    this.fetchTokens()
      .catch((e) => {
        console.error('Error on fetch buy tokens', e);
        this.#state.eventService.emit('buy.tokens.ready', true);
      });

    this.fetchServices()
      .catch((e) => {
        console.error('Error on fetch buy services', e);
        this.#state.eventService.emit('buy.services.ready', true);
      });
  }

  private async fetchTokens () {
    const response = await axios.request({
      method: 'GET',
      url: BUY_TOKEN_URL
    });

    const data = response.data as ListBuyTokenResponse;

    const result: Record<string, BuyTokenInfo> = {};

    for (const datum of data) {
      const temp: BuyTokenInfo = {
        serviceInfo: {
          ...DEFAULT_SERVICE_INFO
        },
        support: datum.support,
        services: [],
        slug: datum.slug,
        symbol: datum.symbol,
        network: datum.network
      };

      for (const [_service, info] of Object.entries(datum.serviceInfo)) {
        const service = _service as SupportService;

        if (info.isSuspended) {
          continue;
        }

        temp.serviceInfo[service] = {
          network: info.network,
          symbol: info.symbol
        };

        temp.services.push(service);
      }

      if (temp.services.length) {
        result[temp.slug] = temp;
      }
    }

    this.buyTokensSubject.next(result);

    this.#state.eventService.emit('buy.tokens.ready', true);
  }

  private async fetchServices () {
    const response = await axios.request({
      method: 'GET',
      url: BUY_SERVICE_CONTACT_URL
    });

    const data = response.data as ListBuyServicesResponse;

    const result: Record<string, BuyServiceInfo> = {};

    for (const datum of data) {
      const { id, slug, ...info } = datum;

      result[slug] = { ...info };
    }

    this.buyServicesSubject.next(result);

    this.#state.eventService.emit('buy.services.ready', true);
  }

  public subscribeBuyTokens (callback: (data: Record<string, BuyTokenInfo>) => void) {
    return this.buyTokensSubject.subscribe({
      next: callback
    });
  }

  public getBuyTokens () {
    return this.buyTokensSubject.getValue();
  }

  public subscribeBuyServices (callback: (data: Record<string, BuyServiceInfo>) => void) {
    return this.buyServicesSubject.subscribe({
      next: callback
    });
  }

  public getBuyServices () {
    return this.buyServicesSubject.getValue();
  }
}
