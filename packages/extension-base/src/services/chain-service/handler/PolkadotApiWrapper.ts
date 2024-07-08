// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainConnectionStatus, _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { createPromiseHandler, PromiseHandler } from '@subwallet/extension-base/utils';
import { createClient, PolkadotClient } from 'polkadot-api';
import { withLogsRecorder } from 'polkadot-api/logs-provider';
import { WebSocketProvider } from 'polkadot-api/ws-provider/web';
import { BehaviorSubject } from 'rxjs';

export class PolkadotApiWrapper implements _SubstrateApi {
  api: PolkadotClient;
  apiUrl: string;
  chainSlug: string;
  useLightClient?: boolean;

  private handleApiReady: PromiseHandler<_SubstrateApi>;

  connectionStatus: _ChainConnectionStatus;

  constructor (chainSlug: string, apiUrl: string) {
    this.chainSlug = chainSlug;
    this.apiUrl = apiUrl;
    const wsProvider = WebSocketProvider('wss://example.url');
    const provider = withLogsRecorder((line) => console.log(line), wsProvider);

    this.connectionStatus = _ChainConnectionStatus.CONNECTED;
    this.api = createClient(provider);
    this.handleApiReady = createPromiseHandler<_SubstrateApi>();
  }

  connect (): void {
    console.log('do nothing');
  }

  destroy (): Promise<void> {
    return Promise.resolve(undefined);
  }

  disconnect (): Promise<void> {
    return Promise.resolve(undefined);
  }

  isApiConnected = false;
  isApiConnectedSubject = new BehaviorSubject(false);
  isApiReady = false;
  isApiReadyOnce = false;

  get isReady (): Promise<_SubstrateApi> {
    return this.handleApiReady.promise;
  }

  recoverConnect (): Promise<void> {
    return Promise.resolve(undefined);
  }

  specName = '';
  specVersion = '';
  systemChain = '';
  systemName = '';
  systemVersion = '';

  updateApiUrl (apiUrl: string): Promise<void> {
    return Promise.resolve(undefined);
  }
}
