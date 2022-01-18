// Copyright 2019-2022 @polkadot/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiPromise, WsProvider } from '@polkadot/api';
import { ApiProps, ApiState } from '@polkadot/extension-base/background/types';
import { TypeRegistry } from '@polkadot/types/create';
import { ChainProperties, ChainType } from '@polkadot/types/interfaces';
import { Registry } from '@polkadot/types/types';
// import {settings as } from '@polkadot/ui-settings';
import { formatBalance, isTestChain, objectSpread, stringify } from '@polkadot/util';
import { defaults as addressDefaults } from '@polkadot/util-crypto/address/defaults';

export enum ApiInitStatus {
  SUCCESS,
  ALREADY_EXIST,
  NOT_SUPPORT
}

export const DEFAULT_AUX = ['Aux1', 'Aux2', 'Aux3', 'Aux4', 'Aux5', 'Aux6', 'Aux7', 'Aux8', 'Aux9'];

interface ChainData {
  properties: ChainProperties;
  systemChain: string;
  systemChainType: ChainType;
  systemName: string;
  systemVersion: string;
}

async function retrieve (registry: Registry, api: ApiPromise): Promise<ChainData> {
  const [systemChain, systemChainType, systemName, systemVersion] = await Promise.all([
    api.rpc.system.chain(),
    api.rpc.system.chainType
      ? api.rpc.system.chainType()
      : Promise.resolve(registry.createType('ChainType', 'Live')),
    api.rpc.system.name(),
    api.rpc.system.version()
  ]);

  return {
    properties: registry.createType('ChainProperties', {
      ss58Format: api.registry.chainSS58,
      tokenDecimals: api.registry.chainDecimals,
      tokenSymbol: api.registry.chainTokens
    }),
    systemChain: (systemChain || '<unknown>').toString(),
    systemChainType,
    systemName: systemName.toString(),
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

export function initApi (apiUrl: string): ApiProps {
  const registry = new TypeRegistry();

  const provider = new WsProvider(apiUrl);

  const api = new ApiPromise({ provider, registry });

  const result: ApiProps = ({
    api,
    apiDefaultTx: undefined,
    apiDefaultTxSudo: undefined,
    apiError: undefined,
    apiUrl,
    defaultFormatBalance: undefined,
    isApiConnected: false,
    isApiInitialized: true,
    isApiReady: false,
    registry,
    specName: '',
    specVersion: '',
    systemChain: '',
    systemName: '',
    systemVersion: '',
    get isReady () {
      const self = this as ApiProps;

      async function f (): Promise<ApiProps> {
        await self.api.isReady;

        return new Promise<ApiProps>((resolve, reject) => {
          // todo: may reject if timeout
          // const timer = setTimeout(() => {
          //   reject(new Error(`API timed out after 10000 ms`));
          // }, 10000);

          (function wait () {
            if (self.isApiReady) {
              return resolve(self);
            }

            setTimeout(wait, 100);
          })();
        });
      }

      return f();
    }
  }) as unknown as ApiProps;

  api.once('connected', () => {
    result.isApiConnected = true;
  });

  api.once('disconnected', () => {
    result.isApiConnected = false;
  });

  api.once('ready', () => {
    loadOnReady(registry, api)
      .then((rs) => {
        objectSpread(result, rs);
      })
      .catch((error): void => {
        result.apiError = (error as Error).message;
      });
  });

  return result;
}
