// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '@polkadot/types-augment';

import { options as acalaOptions } from '@acala-network/api';
import { rpc as oakRpc, types as oakTypes } from '@oak-foundation/types';
import { _API_OPTIONS_CHAIN_GROUP, API_AUTO_CONNECT_MS } from '@subwallet/extension-base/services/chain-service/constants';
import { getSubstrateConnectProvider } from '@subwallet/extension-base/services/chain-service/handler/light-client';
import { DEFAULT_AUX } from '@subwallet/extension-base/services/chain-service/handler/SubstrateChainHandler';
import { typesBundle, typesChain } from '@subwallet/extension-base/services/chain-service/helper/api-helper';
import { _SubstrateApi, _SubstrateDefaultFormatBalance } from '@subwallet/extension-base/services/chain-service/types';
import { createPromiseHandler, PromiseHandler } from '@subwallet/extension-base/utils/promise';
import { BehaviorSubject } from 'rxjs';

import { ApiPromise, WsProvider } from '@polkadot/api';
import { SubmittableExtrinsicFunction } from '@polkadot/api/promise/types';
import { ProviderInterface } from '@polkadot/rpc-provider/types';
import { TypeRegistry } from '@polkadot/types/create';
import { Registry } from '@polkadot/types/types';
import { BN, formatBalance } from '@polkadot/util';
import { defaults as addressDefaults } from '@polkadot/util-crypto/address/defaults';

export class SubstrateApi implements _SubstrateApi {
  chainSlug: string;
  api: ApiPromise;
  providerName?: string;
  provider: ProviderInterface;
  apiRetry = 0;
  apiUrl: string;

  isApiReady = false;
  isApiReadyOnce = false;
  apiError?: string;
  private handleApiReady: PromiseHandler<_SubstrateApi>;
  public readonly isApiConnectedSubject = new BehaviorSubject(false);
  get isApiConnected (): boolean {
    return this.isApiConnectedSubject.getValue();
  }

  private updateConnectedStatus (isConnected: boolean): void {
    if (isConnected !== this.isApiConnectedSubject.value) {
      this.isApiConnectedSubject.next(isConnected);
    }
  }

  apiDefaultTx?: SubmittableExtrinsicFunction;
  apiDefaultTxSudo?: SubmittableExtrinsicFunction;
  defaultFormatBalance?: _SubstrateDefaultFormatBalance;

  registry: Registry;
  specName = '';
  specVersion = '';
  systemChain = '';
  systemName = '';
  systemVersion = '';

  constructor (chainSlug: string, apiUrl: string, providerName?: string) {
    this.chainSlug = chainSlug;
    this.apiUrl = apiUrl;
    this.providerName = providerName;
    this.registry = new TypeRegistry();

    const provider = apiUrl.startsWith('light://')
      ? getSubstrateConnectProvider(apiUrl.replace('light://substrate-connect/', ''))
      : new WsProvider(apiUrl, API_AUTO_CONNECT_MS);

    this.provider = provider;

    const apiOption = {
      provider,
      typesBundle,
      typesChain: typesChain,
      registry: this.registry
    };

    if (_API_OPTIONS_CHAIN_GROUP.acala.includes(chainSlug)) {
      this.api = new ApiPromise(acalaOptions({ provider }));
    } else if (_API_OPTIONS_CHAIN_GROUP.turing.includes(chainSlug)) {
      this.api = new ApiPromise({
        provider,
        rpc: oakRpc,
        types: oakTypes
      });
    } else {
      this.api = new ApiPromise(apiOption);
    }

    this.handleApiReady = createPromiseHandler<_SubstrateApi>();

    this.api.on('ready', this.onReady.bind(this));
    this.api.on('connected', this.onConnect.bind(this));
    this.api.on('disconnected', this.onDisconnect.bind(this));
    this.api.on('error', this.onError.bind(this));
  }

  get isReady (): Promise<_SubstrateApi> {
    return this.handleApiReady.promise;
  }

  connect (): void {
    if (this.api.isConnected) {
      this.updateConnectedStatus(true);
    } else {
      this.api.connect().then(() => {
        this.updateConnectedStatus(true);
      }).catch(console.error);
    }
  }

  disconnect (): void {
    if (this.api.isConnected) {
      this.api.disconnect().catch(console.error).finally(() => {
        this.updateConnectedStatus(false);
      });
    } else {
      this.updateConnectedStatus(false);
    }
  }

  recoverConnect (): void {
    // Todo: update and avoid retry
    this.apiRetry = 0;

    // Todo: Need check this method
    this.connect();
  }

  destroy (): void {
    // Todo: implement this in the future
    return this.disconnect();
  }

  onReady (): void {
    this.fillApiInfo().then(() => {
      this.handleApiReady.resolve(this);
      this.isApiReady = true;
      this.isApiReadyOnce = true;
    }).catch((error) => {
      this.apiError = (error as Error)?.message;
      this.handleApiReady.reject(error);
    });
  }

  onConnect (): void {
    this.apiRetry = 0;
    this.updateConnectedStatus(true);

    if (this.isApiReadyOnce) {
      this.handleApiReady.resolve(this);
    }
  }

  onDisconnect (): void {
    this.isApiReady = false;
    this.updateConnectedStatus(false);
    this.handleApiReady = createPromiseHandler<_SubstrateApi>();
  }

  onError (e: Error): void {
    console.warn(`${this.chainSlug} connection got error`, e);
  }

  async fillApiInfo (): Promise<void> {
    const { api, registry } = this;
    const DEFAULT_DECIMALS = registry.createType('u32', 12);
    const DEFAULT_SS58 = registry.createType('u32', addressDefaults.prefix);

    this.specName = this.api.runtimeVersion.specName.toString();
    this.specVersion = this.api.runtimeVersion.specVersion.toString();
    const [systemChain, systemChainType, systemName, systemVersion] = await Promise.all([
      api.rpc.system?.chain(),
      api.rpc.system?.chainType
        ? api.rpc.system?.chainType()
        : Promise.resolve(registry.createType('ChainType', 'Live')),
      api.rpc.system?.name(),
      api.rpc.system?.version()
    ]);

    this.systemChain = systemChain.toString();
    this.systemName = systemName.toString();
    this.systemVersion = systemVersion.toString();

    const properties = registry.createType('ChainProperties', { ss58Format: api.registry.chainSS58, tokenDecimals: api.registry.chainDecimals, tokenSymbol: api.registry.chainTokens });
    const ss58Format = properties.ss58Format.unwrapOr(DEFAULT_SS58).toNumber();
    const tokenSymbol = properties.tokenSymbol.unwrapOr([formatBalance.getDefaults().unit, ...DEFAULT_AUX]);
    const tokenDecimals = properties.tokenDecimals.unwrapOr([DEFAULT_DECIMALS]);

    console.log(`Connected to ${this.systemChain} (${systemChainType.toString()}) at ${this.apiUrl}`);

    registry.setChainProperties(registry.createType('ChainProperties', { ss58Format, tokenDecimals, tokenSymbol }));

    // first set up the UI helpers
    this.defaultFormatBalance = {
      decimals: tokenDecimals.map((b: BN) => {
        return b.toNumber();
      }),
      unit: tokenSymbol[0].toString()
    };

    const defaultSection = Object.keys(api.tx)[0];
    const defaultMethod = Object.keys(api.tx[defaultSection])[0];

    this.apiDefaultTx = api.tx[defaultSection][defaultMethod];
    this.apiDefaultTxSudo = (api.tx.system && api.tx.system.setCode) || this.apiDefaultTx;
  }
}
