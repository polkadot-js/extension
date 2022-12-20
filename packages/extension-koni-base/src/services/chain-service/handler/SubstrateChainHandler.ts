// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { options as acalaOptions } from '@acala-network/api';
import { rpc as oakRpc, types as oakTypes } from '@oak-foundation/types';
import { DEFAULT_AUX } from '@subwallet/extension-koni-base/api/dotsama';
import { DOTSAMA_AUTO_CONNECT_MS, DOTSAMA_MAX_CONTINUE_RETRY } from '@subwallet/extension-koni-base/constants';
import { typesBundle, typesChain } from '@subwallet/extension-koni-base/services/chain-list/api-helper';
import { _SubstrateChainSpec } from '@subwallet/extension-koni-base/services/chain-service/handler/types';
import { _SubstrateApi, _SubstrateChainMetadata } from '@subwallet/extension-koni-base/services/chain-service/types';
import { inJestTest } from '@subwallet/extension-koni-base/utils';

import { ApiPromise, WsProvider } from '@polkadot/api';
import { ScProvider, WellKnownChain } from '@polkadot/rpc-provider/substrate-connect';
import { TypeRegistry } from '@polkadot/types/create';
import { Registry } from '@polkadot/types/types';
import { formatBalance, isTestChain, objectSpread, stringify } from '@polkadot/util';
import { defaults as addressDefaults } from '@polkadot/util-crypto/address/defaults';

function getWellKnownChain (chain = 'polkadot'): string {
  switch (chain) {
    case 'kusama':
      return WellKnownChain.ksmcc3;
    case 'polkadot':
      return WellKnownChain.polkadot;
    case 'rococo':
      return WellKnownChain.rococo_v2_2;
    case 'westend':
      return WellKnownChain.westend2;
    default:
      return chain;
  }
}

export class SubstrateChainHandler {
  private substrateApiMap: Record<string, _SubstrateApi> = {};

  constructor () {
    console.log(this.substrateApiMap);
  }

  public async getChainSpec (substrateApi: _SubstrateApi) {
    const result: _SubstrateChainSpec = {
      addressPrefix: -1,
      decimals: 0,
      existentialDeposit: '',
      genesisHash: substrateApi.api.genesisHash?.toHex(),
      name: '',
      symbol: '',
      paraId: null
    };

    const { chainDecimals, chainTokens } = substrateApi.api.registry;

    if (substrateApi.api.query.parachainInfo) {
      result.paraId = (await substrateApi.api.query.parachainInfo.parachainId()).toPrimitive() as number;
    }

    // get first token by default, might change
    result.name = (await substrateApi.api.rpc.system.chain()).toPrimitive();
    result.symbol = chainTokens[0];
    result.decimals = chainDecimals[0];
    result.addressPrefix = substrateApi.api?.consts?.system?.ss58Prefix?.toPrimitive() as number;
    result.existentialDeposit = substrateApi.api.consts.balances.existentialDeposit.toString();

    return result;
  }

  public initApi (chainSlug: string, apiUrl: string): _SubstrateApi {
    const registry = new TypeRegistry();

    const provider = apiUrl.startsWith('light://')
      ? new ScProvider(getWellKnownChain(apiUrl.replace('light://substrate-connect/', '')))
      : new WsProvider(apiUrl, DOTSAMA_AUTO_CONNECT_MS);

    const apiOption = { provider, typesBundle, typesChain: typesChain };

    if (!inJestTest()) {
      // @ts-ignore
      apiOption.registry = registry;
    }

    let api: ApiPromise;

    if (['acala', 'karura', 'origintrail', 'kintsugi'].includes(chainSlug)) {
      api = new ApiPromise(acalaOptions({ provider }));
    } else if (['turingStaging', 'turing'].includes(chainSlug)) {
      api = new ApiPromise({
        provider,
        rpc: oakRpc,
        types: oakTypes
      });
    } else {
      api = new ApiPromise(apiOption);
    }

    const substrateApi: _SubstrateApi = ({
      api,

      chainSlug,
      apiUrl,
      apiError: undefined,
      apiRetry: 0,
      isApiReady: false,
      isApiReadyOnce: false,
      isApiConnected: false,
      isApiInitialized: true,

      registry,
      specName: '',
      specVersion: '',
      systemChain: '',
      systemName: '',
      systemVersion: '',

      apiDefaultTx: undefined,
      apiDefaultTxSudo: undefined,
      defaultFormatBalance: undefined,

      recoverConnect: () => {
        substrateApi.apiRetry = 0;
        console.log('Recover connect to ', apiUrl);
        provider.connect().then(console.log).catch(console.error);
      },
      get isReady () {
        const self = this as _SubstrateApi;

        async function f (): Promise<_SubstrateApi> {
          if (!substrateApi.isApiReadyOnce) {
            await self.api.isReady;
          }

          return new Promise<_SubstrateApi>((resolve, reject) => {
            (function wait () {
              if (self.isApiReady) {
                return resolve(self);
              }

              setTimeout(wait, 10);
            })();
          });
        }

        return f();
      }
    }) as unknown as _SubstrateApi;

    api.on('connected', () => {
      console.log('Substrate API connected to ', apiUrl);
      substrateApi.apiRetry = 0;

      if (substrateApi.isApiReadyOnce) {
        substrateApi.isApiReady = true;
      }

      substrateApi.isApiConnected = true;
    });

    api.on('disconnected', () => {
      substrateApi.isApiConnected = false;
      substrateApi.isApiReady = false;
      substrateApi.apiRetry = (substrateApi.apiRetry || 0) + 1;

      console.log(`Substrate API disconnected from ${JSON.stringify(apiUrl)} ${JSON.stringify(substrateApi.apiRetry)} times`);

      if (substrateApi.apiRetry > DOTSAMA_MAX_CONTINUE_RETRY) {
        console.log(`Disconnect from provider ${JSON.stringify(apiUrl)} because retry maxed out`);
        provider.disconnect()
          .then(console.log)
          .catch(console.error);
      }
    });

    api.on('ready', () => {
      console.log('Substrate API ready with', apiUrl);
      this.loadOnReady(registry, api)
        .then((rs) => {
          objectSpread(substrateApi, rs);
        })
        .catch((error): void => {
          substrateApi.apiError = (error as Error).message;
        });
    });

    return substrateApi;
  }

  private async getChainMetadata (registry: Registry, api: ApiPromise): Promise<_SubstrateChainMetadata> {
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

  private async loadOnReady (registry: Registry, api: ApiPromise): Promise<Record<string, any>> {
    const DEFAULT_DECIMALS = registry.createType('u32', 12);
    const DEFAULT_SS58 = registry.createType('u32', addressDefaults.prefix);
    const { properties, systemChain, systemChainType, systemName, systemVersion } = await this.getChainMetadata(registry, api);
    const ss58Format = properties.ss58Format.unwrapOr(DEFAULT_SS58).toNumber();
    const tokenSymbol = properties.tokenSymbol.unwrapOr([formatBalance.getDefaults().unit, ...DEFAULT_AUX]);
    const tokenDecimals = properties.tokenDecimals.unwrapOr([DEFAULT_DECIMALS]);
    const isDevelopment = (systemChainType.isDevelopment || systemChainType.isLocal || isTestChain(systemChain));

    console.log(`chain: ${systemChain} (${systemChainType.toString()}), ${stringify(properties)}`);

    // explicitly override the ss58Format as specified
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    registry.setChainProperties(registry.createType('ChainProperties', { ss58Format, tokenDecimals, tokenSymbol }));

    // first set up the UI helpers
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
      isApiReadyOnce: true,
      isDevelopment: isDevelopment,
      specName: api.runtimeVersion.specName.toString(),
      specVersion: api.runtimeVersion.specVersion.toString(),
      systemChain,
      systemName,
      systemVersion
    };
  }
}
