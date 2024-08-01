// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '@polkadot/types-augment';

import { options as acalaOptions } from '@acala-network/api';
import { GearApi } from '@gear-js/api';
import { rpc as oakRpc, types as oakTypes } from '@oak-foundation/types';
import { MetadataItem } from '@subwallet/extension-base/background/KoniTypes';
import { _API_OPTIONS_CHAIN_GROUP, API_AUTO_CONNECT_MS, API_CONNECT_TIMEOUT } from '@subwallet/extension-base/services/chain-service/constants';
import { getSubstrateConnectProvider } from '@subwallet/extension-base/services/chain-service/handler/light-client';
import { _ApiOptions } from '@subwallet/extension-base/services/chain-service/handler/types';
import { _ChainConnectionStatus, _SubstrateAdapterQueryArgs, _SubstrateAdapterSubscriptionArgs, _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { createPromiseHandler, PromiseHandler } from '@subwallet/extension-base/utils/promise';
import { goldbergRpc, goldbergTypes, spec as availSpec } from 'avail-js-sdk';
import { BehaviorSubject, combineLatest, map, Observable, Subscription } from 'rxjs';

import { ApiPromise, WsProvider } from '@polkadot/api';
import { ApiOptions } from '@polkadot/api/types';
import { typesBundle as _typesBundle } from '@polkadot/apps-config/api';
import { ProviderInterface } from '@polkadot/rpc-provider/types';
import { TypeRegistry } from '@polkadot/types/create';
import { AnyJson, OverrideBundleDefinition, Registry } from '@polkadot/types/types';

const typesBundle = { ..._typesBundle };

// Override avail spec for signedExtensions
const _availSpec: OverrideBundleDefinition = {
  signedExtensions: availSpec.signedExtensions
};

// Override avail goldberg spec for signedExtensions
const _goldbergSpec: OverrideBundleDefinition = {
  signedExtensions: availSpec.signedExtensions
};

if (typesBundle.spec) {
  typesBundle.spec.avail = _availSpec;
  typesBundle.spec['data-avail'] = _goldbergSpec;
}

export class SubstrateApi implements _SubstrateApi {
  chainSlug: string;
  api: ApiPromise;
  providerName?: string;
  provider: ProviderInterface;
  apiUrl: string;
  metadata?: MetadataItem;

  useLightClient = false;
  isApiReady = false;
  isApiReadyOnce = false;
  apiError?: string;
  private handleApiReady: PromiseHandler<_SubstrateApi>;
  public readonly isApiConnectedSubject = new BehaviorSubject(false);
  public readonly connectionStatusSubject = new BehaviorSubject(_ChainConnectionStatus.DISCONNECTED);
  get isApiConnected (): boolean {
    return this.isApiConnectedSubject.getValue();
  }

  substrateRetry = 0;

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

  // apiDefaultTx?: SubmittableExtrinsicFunction;
  // apiDefaultTxSudo?: SubmittableExtrinsicFunction;
  // defaultFormatBalance?: _SubstrateDefaultFormatBalance;

  registry: Registry;
  specName = '';
  specVersion = '';
  systemChain = '';
  systemName = '';
  systemVersion = '';

  private createProvider (apiUrl: string): ProviderInterface {
    if (apiUrl.startsWith('light://')) {
      this.useLightClient = true;

      return getSubstrateConnectProvider(apiUrl.replace('light://substrate-connect/', ''));
    } else {
      this.useLightClient = true;

      return new WsProvider(apiUrl, API_AUTO_CONNECT_MS, {}, API_CONNECT_TIMEOUT);
    }
  }

  private createApi (provider: ProviderInterface, externalApiPromise?: ApiPromise): ApiPromise {
    const apiOption: ApiOptions = {
      provider,
      typesBundle,
      registry: this.registry, // This line makes this object registry to be the same as the api registry
      noInitWarn: true
    };

    if (this.metadata) {
      const metadata = this.metadata;

      apiOption.metadata = {
        [`${metadata.genesisHash}-${metadata.specVersion}`]: metadata.hexValue
      };
    }

    this.updateConnectionStatus(_ChainConnectionStatus.CONNECTING);

    let api: ApiPromise;

    if (externalApiPromise) {
      api = externalApiPromise;
    } else if (_API_OPTIONS_CHAIN_GROUP.acala.includes(this.chainSlug)) {
      api = new ApiPromise(acalaOptions(apiOption));
    } else if (_API_OPTIONS_CHAIN_GROUP.turing.includes(this.chainSlug)) {
      api = new ApiPromise({
        ...apiOption,
        rpc: oakRpc,
        types: oakTypes
      });
    } else if (_API_OPTIONS_CHAIN_GROUP.avail.includes(this.chainSlug)) {
      api = new ApiPromise({
        ...apiOption,
        rpc: availSpec.rpc,
        types: availSpec.types,
        signedExtensions: availSpec.signedExtensions
      });
    } else if (_API_OPTIONS_CHAIN_GROUP.goldberg.includes(this.chainSlug)) {
      api = new ApiPromise({
        ...apiOption,
        rpc: goldbergRpc,
        types: goldbergTypes,
        signedExtensions: availSpec.signedExtensions
      });
    } else if (_API_OPTIONS_CHAIN_GROUP.gear.includes(this.chainSlug)) {
      api = new GearApi({
        provider,
        noInitWarn: true
      });
    } else {
      api = new ApiPromise(apiOption);
    }

    api.on('ready', this.onReady.bind(this));
    api.on('connected', this.onConnect.bind(this));
    api.on('disconnected', this.onDisconnect.bind(this));
    api.on('error', this.onError.bind(this));

    return api;
  }

  constructor (chainSlug: string, apiUrl: string, { externalApiPromise, metadata, providerName }: _ApiOptions = {}) {
    this.chainSlug = chainSlug;
    this.apiUrl = apiUrl;
    this.providerName = providerName;
    this.registry = new TypeRegistry();
    this.metadata = metadata;
    this.provider = this.createProvider(apiUrl);
    this.api = this.createApi(this.provider, externalApiPromise);

    this.handleApiReady = createPromiseHandler<_SubstrateApi>();
  }

  get isReady (): Promise<_SubstrateApi> {
    return this.handleApiReady.promise;
  }

  async updateApiUrl (apiUrl: string) {
    if (this.apiUrl === apiUrl) {
      return;
    }

    // Disconnect with old provider
    await this.disconnect();
    this.isApiReadyOnce = false;
    this.api.off('ready', this.onReady.bind(this));
    this.api.off('connected', this.onConnect.bind(this));
    this.api.off('disconnected', this.onDisconnect.bind(this));
    this.api.off('error', this.onError.bind(this));

    // Create new provider and api
    this.apiUrl = apiUrl;
    this.provider = this.createProvider(apiUrl);
    this.api = this.createApi(this.provider);
  }

  connect (_callbackUpdateMetadata?: (substrateApi: _SubstrateApi) => void): void {
    if (this.api.isConnected) {
      this.updateConnectionStatus(_ChainConnectionStatus.CONNECTED);
      _callbackUpdateMetadata?.(this);
    } else {
      this.updateConnectionStatus(_ChainConnectionStatus.CONNECTING);

      this.api.connect()
        .then(() => {
          this.api.isReady.then(() => {
            this.updateConnectionStatus(_ChainConnectionStatus.CONNECTED);
            _callbackUpdateMetadata?.(this);
          }).catch(console.error);
        }).catch(console.error);
    }
  }

  async disconnect () {
    try {
      await this.api.disconnect();
    } catch (e) {
      console.error(e);
    }

    this.updateConnectionStatus(_ChainConnectionStatus.DISCONNECTED);
  }

  async recoverConnect () {
    await this.disconnect();
    this.connect();
    await this.handleApiReady.promise;
  }

  destroy () {
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
    this.updateConnectionStatus(_ChainConnectionStatus.CONNECTED);
    this.substrateRetry = 0;
    console.log(`Connected to ${this.chainSlug || ''} at ${this.apiUrl}`);

    if (this.isApiReadyOnce) {
      this.handleApiReady.resolve(this);
    }
  }

  onDisconnect (): void {
    this.isApiReady = false;
    console.log(`Disconnected from ${this.chainSlug} at ${this.apiUrl}`);
    this.updateConnectionStatus(_ChainConnectionStatus.DISCONNECTED);
    this.handleApiReady = createPromiseHandler<_SubstrateApi>();
    this.substrateRetry += 1;

    if (this.substrateRetry > 9) {
      this.disconnect().then(() => {
        this.updateConnectionStatus(_ChainConnectionStatus.UNSTABLE);
      }).catch(console.error);
    }
  }

  onError (e: Error): void {
    console.warn(`${this.chainSlug} connection got error`, e);
  }

  async fillApiInfo (): Promise<void> {
    // const { registry } = this;
    // const DEFAULT_DECIMALS = registry.createType('u32', 12);
    // const DEFAULT_SS58 = registry.createType('u32', addressDefaults.prefix);

    this.specName = this.api.runtimeVersion.specName.toString();
    this.specVersion = this.api.runtimeVersion.specVersion.toString();

    const [systemChain, systemName, systemVersion] = await Promise.all([
      this.makeRpcQuery<string>({ section: 'rpc', module: 'system', method: 'chain' }),
      this.makeRpcQuery<string>({ section: 'rpc', module: 'system', method: 'name' }),
      this.makeRpcQuery<string>({ section: 'rpc', module: 'system', method: 'version' })
    ]);

    this.systemChain = systemChain.toString();
    this.systemName = systemName.toString();
    this.systemVersion = systemVersion.toString();

    // const [ss58Format, tokenDecimals, tokenSymbol] = await Promise.all([
    //   this.makeRpcQuery<number | undefined>({ section: 'registry', module: 'chainSS58' }),
    //   this.makeRpcQuery<number[]>({ section: 'registry', module: 'chainDecimals' }),
    //   this.makeRpcQuery<string[]>({ section: 'registry', module: 'chainTokens' })
    // ]);
    //
    // const properties = registry.createType('ChainProperties', {
    //   ss58Format,
    //   tokenDecimals,
    //   tokenSymbol
    // });
    // const ss58Format = properties.ss58Format.unwrapOr(DEFAULT_SS58).toNumber();
    // const tokenSymbol = properties.tokenSymbol.unwrapOr([formatBalance.getDefaults().unit, ...DEFAULT_AUX]);
    // const tokenDecimals = properties.tokenDecimals.unwrapOr([DEFAULT_DECIMALS]);
    //
    // registry.setChainProperties(registry.createType('ChainProperties', { ss58Format, tokenDecimals, tokenSymbol }));

    // first set up the UI helpers
    // this.defaultFormatBalance = {
    //   decimals: tokenDecimals.map((b: BN) => {
    //     return b.toNumber();
    //   }),
    //   unit: tokenSymbol[0].toString()
    // };
    //
    // const defaultSection = Object.keys(api.tx)[0];
    // const defaultMethod = Object.keys(api.tx[defaultSection])[0];

    // this.apiDefaultTx = api.tx[defaultSection][defaultMethod];
    // this.apiDefaultTxSudo = (api.tx.system && api.tx.system.setCode) || this.apiDefaultTx;
  }

  async makeRpcQuery<T> ({ args, method, module, section }: _SubstrateAdapterQueryArgs): Promise<T> {
    const isGetterCall = section === 'genesisHash' || section === 'extrinsicVersion' || section === 'runtimeVersion' || section === 'runtimeMetadata' || section === 'registry';
    const isRuntimeConstQuery = section === 'consts' && !!method && !!module && !args;
    const isRpcQuery = section === 'rpc' && !!method && !!module && !args;
    const isStateQuery = section === 'query' && method && module;

    if (isGetterCall) {
      if (section === 'genesisHash') {
        return this.api[section].toHex() as T;
      } else if (section === 'extrinsicVersion') {
        return this.api[section] as T;
      } else if (section === 'runtimeVersion') {
        return this.api[section].toPrimitive() as T;
      } else if (section === 'runtimeMetadata') {
        return this.api[section].toHex() as T;
      } else if (section === 'registry') {
        return this.api[section] as T;
      }
    }

    if (isRuntimeConstQuery) {
      if (!this.api[section][module]) {
        return undefined as T;
      }

      return this.api[section][module][method].toPrimitive() as T;
    }

    if (isRpcQuery) {
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      if (!this.api[section][module]) {
        return undefined as T;
      }

      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      return (await this.api[section][module][method]()).toPrimitive() as T; // todo: improve this
    }

    if (isStateQuery) {
      if (!this.api[section][module]) {
        return undefined as T;
      }

      if (args) {
        return (await this.api[section][module][method](...args)).toPrimitive() as T;
      } else {
        return (await this.api[section][module][method]()).toPrimitive() as T;
      }
    }

    return Promise.reject(new Error('Cannot handle query'));
  }

  subscribeDataWithMulti (params: _SubstrateAdapterSubscriptionArgs[], callback: (rs: Record<string, AnyJson[]>) => void): Subscription {
    const apiRx = this.api.rx;
    const observables: Record<string, Observable<AnyJson[]>> = {};

    params.forEach((queryParams) => {
      const { args, method, module, section } = queryParams;
      const key = `${section}_${module}_${method}`;

      if (!this.api[section][module] || !this.api[section][module][method]) { // if method not found, returns an empty observable
        observables[key] = new Observable<AnyJson[]>((subscriber) => {
          subscriber.next([]);
        });
      } else {
        observables[key] = apiRx[section][module][method]
          .multi(args)
          .pipe(
            map((codecs) => codecs.map(
              (codec) => codec.toPrimitive()
            ))
          );
      }
    });

    return combineLatest(observables).subscribe(callback);
  }
}
