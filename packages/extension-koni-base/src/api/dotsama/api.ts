// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { options as acalaOptions } from '@acala-network/api';
import { rpc as oakRpc, types as oakTypes } from '@oak-foundation/types';
import { ApiProps, ApiState } from '@subwallet/extension-base/background/KoniTypes';
import { typesBundle, typesChain } from '@subwallet/extension-koni-base/api/dotsama/api-helper';
import { getSubstrateConnectProvider } from '@subwallet/extension-koni-base/api/dotsama/light-client';
import { DOTSAMA_AUTO_CONNECT_MS, DOTSAMA_MAX_CONTINUE_RETRY } from '@subwallet/extension-koni-base/constants';
import { inJestTest } from '@subwallet/extension-koni-base/utils';

import { ApiPromise, WsProvider } from '@polkadot/api';
import { TypeRegistry } from '@polkadot/types/create';
import { ChainProperties, ChainType } from '@polkadot/types/interfaces';
import { Registry } from '@polkadot/types/types';
import { formatBalance, isTestChain, objectSpread, stringify } from '@polkadot/util';
import { defaults as addressDefaults } from '@polkadot/util-crypto/address/defaults';

export const DEFAULT_AUX = ['Aux1', 'Aux2', 'Aux3', 'Aux4', 'Aux5', 'Aux6', 'Aux7', 'Aux8', 'Aux9'];

interface ChainData {
  properties: ChainProperties;
  systemChain: string;
  systemChainType: ChainType;
  systemName: string;
  systemVersion: string;
}

async function retrieve (registry: Registry, api: ApiPromise): Promise<ChainData> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const [systemChain, systemChainType, systemName, systemVersion] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    api.rpc.system?.chain(),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    api.rpc.system?.chainType
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      ? api.rpc.system?.chainType()
      : Promise.resolve(registry.createType('ChainType', 'Live')),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    api.rpc.system?.name(),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    api.rpc.system?.version()
  ]);

  return {
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    properties: registry.createType('ChainProperties', { ss58Format: api.registry.chainSS58, tokenDecimals: api.registry.chainDecimals, tokenSymbol: api.registry.chainTokens }),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
    systemChain: (systemChain || '<unknown>').toString(),
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    systemChainType,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    systemName: systemName.toString(),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    systemVersion: systemVersion.toString()
  };
}

async function loadOnReady (registry: Registry, api: ApiPromise): Promise<ApiState> {
  const DEFAULT_DECIMALS = registry.createType('u32', 12);
  const DEFAULT_SS58 = registry.createType('u32', addressDefaults.prefix);
  const { properties, systemChain, systemChainType, systemName, systemVersion } = await retrieve(registry, api);
  const ss58Format = properties.ss58Format.unwrapOr(DEFAULT_SS58).toNumber();
  const tokenSymbol = properties.tokenSymbol.unwrapOr([formatBalance.getDefaults().unit, ...DEFAULT_AUX]);
  const tokenDecimals = properties.tokenDecimals.unwrapOr([DEFAULT_DECIMALS]);
  const isDevelopment = (systemChainType.isDevelopment || systemChainType.isLocal || isTestChain(systemChain));

  console.log(`chain: ${systemChain} (${systemChainType.toString()}), ${stringify(properties)}`);

  // explicitly override the ss58Format as specified
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  registry.setChainProperties(registry.createType('ChainProperties', { ss58Format, tokenDecimals, tokenSymbol }));

  // first setup the UI helpers
  const defaultFormatBalance = {
    decimals: tokenDecimals.map((b) => b.toNumber()),
    unit: tokenSymbol[0].toString()
  };

  const defaultSection = Object.keys(api.tx)[0];
  const defaultMethod = Object.keys(api.tx[defaultSection])[0];
  const apiDefaultTx = api.tx[defaultSection][defaultMethod];
  const apiDefaultTxSudo = (api.tx.system && api.tx.system.setCode) || apiDefaultTx;

  return {
    defaultFormatBalance,
    registry,
    apiDefaultTx,
    apiDefaultTxSudo,
    isApiReady: true,
    isDevelopment: isDevelopment,
    specName: api.runtimeVersion.specName.toString(),
    specVersion: api.runtimeVersion.specVersion.toString(),
    systemChain,
    systemName,
    systemVersion
  };
}

function generateEvmHttpApi (apiUrl: string): ApiProps {
  const registry = new TypeRegistry();

  return ({
    api: new Proxy({}, {
      get (target, prop, receiver) {
        console.debug('Access virtual API', target, prop, receiver);
      }
    }),
    apiDefaultTx: undefined,
    apiDefaultTxSudo: undefined,
    apiError: undefined,
    apiUrl,
    defaultFormatBalance: undefined,
    isApiConnected: true,
    isApiReady: true,
    isApiInitialized: true,
    isEthereum: true,
    isEthereumOnly: true,
    registry,
    specName: '',
    specVersion: '',
    systemChain: '',
    systemName: '',
    systemVersion: '',
    apiRetry: 0,
    recoverConnect: () => {
      console.log('Reconnect http API', apiUrl);
    },
    get isReady () {
      return Promise.resolve(this);
    }
  }) as unknown as ApiProps;
}

export async function initApi (networkKey: string, apiUrl: string, isEthereum?: boolean): Promise<ApiProps> {
  if (isEthereum && apiUrl.startsWith('http')) {
    // return EVM HTTP Placeholder
    return generateEvmHttpApi(apiUrl);
  }

  const registry = new TypeRegistry();

  const provider = apiUrl.startsWith('light://')
    ? await getSubstrateConnectProvider(apiUrl.replace('light://substrate-connect/', ''))
    : new WsProvider(apiUrl, DOTSAMA_AUTO_CONNECT_MS);

  const apiOption = { provider, typesBundle, typesChain: typesChain };

  if (!inJestTest()) {
    // @ts-ignore
    apiOption.registry = registry;
  }

  // Init ApiPromise with selected provider
  let api: ApiPromise;

  if (['acala', 'karura', 'origintrail', 'kintsugi'].includes(networkKey)) {
    api = new ApiPromise(acalaOptions({ provider }));
  } else if (['turingStaging', 'turing'].includes(networkKey)) {
    api = new ApiPromise({
      provider,
      rpc: oakRpc,
      types: oakTypes
    });
  } else {
    api = new ApiPromise(apiOption);
  }

  const connectionPromise: {
    promise: Promise<void>,
    resolve: (value: void) => void,
    reject: () => void,
    renew: () => void
  } = {
    promise: new Promise(() => {
      throw new Error('Function not implemented.');
    }),
    resolve: function (): void {
      throw new Error('Function not implemented.');
    },
    reject: function (): void {
      throw new Error('Function not implemented.');
    },
    renew: function (): void {
      connectionPromise.promise = new Promise<void>((resolve, reject) => {
        connectionPromise.resolve = resolve;
        connectionPromise.reject = reject;
      });
    }
  };

  connectionPromise.renew();

  // Create APIProps Object
  const result: ApiProps = ({
    api,
    apiDefaultTx: undefined,
    apiDefaultTxSudo: undefined,
    apiError: undefined,
    apiUrl,
    defaultFormatBalance: undefined,
    isApiConnected: false,
    isApiReady: false,
    isApiInitialized: false,
    isEthereum,
    isEthereumOnly: false,
    registry,
    specName: '',
    specVersion: '',
    systemChain: '',
    systemName: '',
    systemVersion: '',
    apiRetry: 0,
    recoverConnect: () => {
      result.apiRetry = 0;
      console.log('Recover connect to', apiUrl);
      provider.connect().then(console.log).catch(console.error);
    },
    get isReady () {
      const self = this as ApiProps;

      return async function f (): Promise<ApiProps> {
        if (!self.isApiReady) {
          await self.api.isReady;
          await connectionPromise.promise;
        }

        return self;
      };
    }
  }) as unknown as ApiProps;

  // Todo: Create reconnect method

  // Listen ApiPromise events
  // On connected: provider is connected
  api.on('connected', () => {
    console.log('DotSamaAPI connected to', apiUrl);
    result.apiRetry = 0;
    result.isApiConnected = true;
    result.isApiReady = result.isApiInitialized; // result.isApiInitialized && result.isApiConnected
    connectionPromise.resolve();
  });

  // On disconnected: provider is disconnected
  api.on('disconnected', () => {
    result.apiRetry = (result.apiRetry || 0) + 1;
    result.isApiConnected = false;
    result.isApiReady = false; // result.isApiInitialized && result.isApiConnected
    connectionPromise.renew();

    console.log(`DotSamaAPI disconnected from ${JSON.stringify(apiUrl)} ${JSON.stringify(result.apiRetry)} times`);

    if (result.apiRetry > DOTSAMA_MAX_CONTINUE_RETRY) {
      console.log(`Discontinue to use ${JSON.stringify(apiUrl)} because max retry`);
      provider.disconnect()
        .then(console.log)
        .catch(console.error);
    } else {
      // Todo: Implement reconnect api here
    }
  });

  // On ready: Load all metadata and ready to init data
  api.on('ready', () => {
    console.log('DotSamaAPI ready with', apiUrl);
    loadOnReady(registry, api)
      .then((rs) => {
        objectSpread(result, rs);
      })
      .catch((error): void => {
        result.apiError = (error as Error).message;
      });
  });
  // Todo: On error: provider connection get error
  // Todo: On decorated: implement all basic methods

  return result;
}
