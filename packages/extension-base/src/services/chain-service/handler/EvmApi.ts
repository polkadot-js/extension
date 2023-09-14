// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '@polkadot/types-augment';

import { _ApiOptions } from '@subwallet/extension-base/services/chain-service/handler/types';
import { _ChainConnectionStatus, _EvmApi } from '@subwallet/extension-base/services/chain-service/types';
import { createPromiseHandler, PromiseHandler } from '@subwallet/extension-base/utils/promise';
import { BehaviorSubject } from 'rxjs';
import Web3 from 'web3';
import { HttpProvider, WebsocketProvider } from 'web3-core';

const acalaEvmNetworks: string[] = ['acala_evm', 'karura_evm'];

export class EvmApi implements _EvmApi {
  chainSlug: string;
  api: Web3;
  apiUrl: string;
  provider: HttpProvider | WebsocketProvider;
  apiError?: string;
  apiRetry = 0;
  public readonly isApiConnectedSubject = new BehaviorSubject(false);
  public readonly connectionStatusSubject = new BehaviorSubject(_ChainConnectionStatus.DISCONNECTED);
  isApiReady = false;
  isApiReadyOnce = false;
  isReadyHandler: PromiseHandler<_EvmApi>;
  intervalCheckApi: NodeJS.Timer;

  providerName: string;

  get isApiConnected (): boolean {
    return this.isApiConnectedSubject.getValue();
  }

  get connectionStatus (): _ChainConnectionStatus {
    return this.connectionStatusSubject.getValue();
  }

  private updateConnectionStatus (status: _ChainConnectionStatus): void {
    const isConnected = status === _ChainConnectionStatus.CONNECTED;

    if (isConnected !== this.isApiConnectedSubject.value) {
      this.isApiConnectedSubject.next(isConnected);
    }

    if (status !== this.connectionStatusSubject.value) {
      this.connectionStatusSubject.next(status);
    }
  }

  get isReady (): Promise<_EvmApi> {
    return this.isReadyHandler.promise;
  }

  async updateApiUrl (apiUrl: string) {
    this.apiUrl = apiUrl;

    await this.disconnect();
    this.api.setProvider(this.createProvider(apiUrl));
    this.connect();
  }

  async recoverConnect () {
    const wsProvider = this.provider as WebsocketProvider;

    if (wsProvider.reconnect) {
      wsProvider.reconnect();
    }

    await this.isReadyHandler.promise;
  }

  private createProvider (apiUrl: string): HttpProvider | WebsocketProvider {
    if (apiUrl.startsWith('http')) {
      return new Web3.providers.HttpProvider(apiUrl);
    } else {
      return new Web3.providers.WebsocketProvider(apiUrl);
    }
  }

  constructor (chainSlug: string, apiUrl: string, { providerName }: _ApiOptions = {}) {
    this.chainSlug = chainSlug;
    this.apiUrl = apiUrl;
    this.providerName = providerName || 'unknown';
    this.provider = this.createProvider(apiUrl);
    this.api = new Web3(this.provider);
    this.isReadyHandler = createPromiseHandler<_EvmApi>();

    // Create it only to avoid undefined error, it will be overwrite in connect()
    this.intervalCheckApi = this.createIntervalCheckApi();
    this.connect();
  }

  createIntervalCheckApi (): NodeJS.Timer {
    this.clearIntervalCheckApi();

    return setInterval(() => {
      if (!acalaEvmNetworks.includes(this.chainSlug)) {
        this.api.eth.net.isListening()
          .then(() => {
            this.onConnect();
          }).catch(() => {
            this.onDisconnect();
          });
      } else {
        this.onConnect();
      }
    }, 10000);
  }

  clearIntervalCheckApi (): void {
    clearInterval(this.intervalCheckApi);
  }

  connect (): void {
    // For websocket provider, connect it
    const wsProvider = this.provider as WebsocketProvider;

    wsProvider.connect && wsProvider.connect();
    this.updateConnectionStatus(_ChainConnectionStatus.CONNECTING);

    // Check if api is ready
    if (!acalaEvmNetworks.includes(this.chainSlug)) {
      this.api.eth.net.isListening()
        .then(() => {
          this.isApiReadyOnce = true;
          this.onConnect();
        }).catch((error) => {
          this.isApiReadyOnce = false;
          this.isApiReady = false;
          this.isReadyHandler.reject(error);
          this.updateConnectionStatus(_ChainConnectionStatus.DISCONNECTED);
          console.warn(`Can not connect to ${this.chainSlug} (EVM) at ${this.apiUrl}`);
        });
    } else {
      this.isApiReadyOnce = true;
      this.onConnect();
    }

    // Interval to check connecting status
    this.intervalCheckApi = this.createIntervalCheckApi();
  }

  async disconnect () {
    this.clearIntervalCheckApi();
    this.onDisconnect();

    // For websocket provider, disconnect it
    const wsProvider = this.provider as WebsocketProvider;

    wsProvider.disconnect && wsProvider.disconnect();

    this.updateConnectionStatus(_ChainConnectionStatus.DISCONNECTED);

    return Promise.resolve();
  }

  destroy () {
    // Todo: implement this in the future
    return this.disconnect();
  }

  onConnect (): void {
    if (!this.isApiConnected) {
      console.log(`Connected to ${this.chainSlug} at ${this.apiUrl}`);
      this.isApiReady = true;

      if (this.isApiReadyOnce) {
        this.isReadyHandler.resolve(this);
      }
    }

    this.updateConnectionStatus(_ChainConnectionStatus.CONNECTED);
  }

  onDisconnect (): void {
    this.updateConnectionStatus(_ChainConnectionStatus.DISCONNECTED);

    if (this.isApiConnected) {
      console.warn(`Disconnected from ${this.chainSlug} of ${this.apiUrl} (EVM)`);
      this.isApiReady = false;
      this.isReadyHandler = createPromiseHandler<_EvmApi>();
    }
  }
}
