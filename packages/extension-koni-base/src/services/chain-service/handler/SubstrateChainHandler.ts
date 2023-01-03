// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { options as acalaOptions } from '@acala-network/api';
import { rpc as oakRpc, types as oakTypes } from '@oak-foundation/types';
import { _AssetType } from '@subwallet/chain/types';
import { DEFAULT_AUX } from '@subwallet/extension-koni-base/api/dotsama';
import { typesBundle, typesChain } from '@subwallet/extension-koni-base/api/dotsama/api-helper';
import { _API_OPTIONS_GROUP, API_AUTO_CONNECT_MS, API_MAX_RETRY } from '@subwallet/extension-koni-base/services/chain-service/constants';
import { _SubstrateChainSpec } from '@subwallet/extension-koni-base/services/chain-service/handler/types';
import { _PSP22_ABI, _PSP34_ABI } from '@subwallet/extension-koni-base/services/chain-service/helper';
import { _SmartContractTokenInfo, _SubstrateApi, _SubstrateChainMetadata } from '@subwallet/extension-koni-base/services/chain-service/types';

import { ApiPromise, WsProvider } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import { ScProvider, WellKnownChain } from '@polkadot/rpc-provider/substrate-connect';
import { TypeRegistry } from '@polkadot/types/create';
import { Registry } from '@polkadot/types/types';
import { formatBalance, isTestChain, objectSpread, stringify } from '@polkadot/util';
import { logger as createLogger } from '@polkadot/util/logger';
import { Logger } from '@polkadot/util/types';
import { defaults as addressDefaults } from '@polkadot/util-crypto/address/defaults';

function getSubstrateConnectChain (chain = 'polkadot'): string {
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
  private logger: Logger;

  constructor () {
    this.logger = createLogger('substrate-chain-handler');
  }

  public getSubstrateApiMap () {
    return this.substrateApiMap;
  }

  public getSubstrateApiByChain (chainSlug: string) {
    return this.substrateApiMap[chainSlug];
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

  public async getSmartContractTokenInfo (contractAddress: string, tokenType: _AssetType, originChain: string, contractCaller?: string): Promise<_SmartContractTokenInfo> {
    let tokenContract: ContractPromise;
    let name = '';
    let decimals: number | undefined = -1;
    let symbol = '';
    let contractError = false;

    const substrateApi = this.getSubstrateApiByChain(originChain);

    try {
      if (tokenType === _AssetType.PSP22) {
        tokenContract = new ContractPromise(substrateApi.api, _PSP22_ABI, contractAddress);

        const [nameResp, symbolResp, decimalsResp] = await Promise.all([
          tokenContract.query['psp22Metadata::tokenName'](contractCaller || contractAddress, { gasLimit: -1 }), // read-only operation so no gas limit
          tokenContract.query['psp22Metadata::tokenSymbol'](contractCaller || contractAddress, { gasLimit: -1 }),
          tokenContract.query['psp22Metadata::tokenDecimals'](contractCaller || contractAddress, { gasLimit: -1 })
        ]);

        if (!(nameResp.result.isOk && symbolResp.result.isOk && decimalsResp.result.isOk) || !nameResp.output || !decimalsResp.output || !symbolResp.output) {
          this.logger.error('Error response while validating WASM contract');

          return {
            name: '',
            decimals: -1,
            symbol: '',
            contractError: true
          };
        } else {
          name = symbolResp.output?.toHuman() as string;
          decimals = parseInt(decimalsResp.output?.toHuman() as string);
          symbol = symbolResp.output?.toHuman() as string;

          if (name === '' || symbol === '') {
            contractError = true;
          }
        }
      } else {
        tokenContract = new ContractPromise(substrateApi.api, _PSP34_ABI, contractAddress);

        const collectionIdResp = await tokenContract.query['psp34::collectionId'](contractCaller || contractAddress, { gasLimit: -1 }); // read-only operation so no gas limit

        if (!collectionIdResp.result.isOk || !collectionIdResp.output) {
          this.logger.error('Error response while validating WASM contract');

          return {
            name: '',
            decimals: -1,
            symbol: '',
            contractError: true
          };
        } else {
          const collectionIdDict = collectionIdResp.output?.toHuman() as Record<string, string>;

          if (collectionIdDict.Bytes === '') {
            contractError = true;
          } else {
            name = ''; // no function to get collection name, let user manually put in the name
          }
        }
      }

      return {
        name,
        decimals,
        symbol,
        contractError
      };
    } catch (e) {
      this.logger.error('Error validating WASM contract', e);

      return {
        name: '',
        decimals: -1,
        symbol: '',
        contractError: true
      };
    }
  }

  public setSubstrateApi (chainSlug: string, substrateApi: _SubstrateApi) {
    this.substrateApiMap[chainSlug] = substrateApi;
  }

  public initApi (chainSlug: string, apiUrl: string, providerName?: string): _SubstrateApi {
    const registry = new TypeRegistry();

    const provider = apiUrl.startsWith('light://')
      ? new ScProvider(getSubstrateConnectChain(apiUrl.replace('light://substrate-connect/', '')))
      : new WsProvider(apiUrl, API_AUTO_CONNECT_MS);

    const apiOption = { provider, typesBundle, typesChain: typesChain };

    // @ts-ignore
    apiOption.registry = registry;

    let api: ApiPromise;

    if (_API_OPTIONS_GROUP.acala.includes(chainSlug)) {
      api = new ApiPromise(acalaOptions({ provider }));
    } else if (_API_OPTIONS_GROUP.turing.includes(chainSlug)) {
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
      providerName,

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
        this.logger.log('Recover connect to ', apiUrl);
        provider.connect().then(this.logger.log).catch(this.logger.error);
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
      this.logger.log('Substrate API connected to ', apiUrl);
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

      this.logger.log(`Substrate API disconnected from ${JSON.stringify(apiUrl)} ${JSON.stringify(substrateApi.apiRetry)} times`);

      if (substrateApi.apiRetry > API_MAX_RETRY) {
        this.logger.log(`Disconnect from provider ${JSON.stringify(apiUrl)} because retry maxed out`);
        provider.disconnect()
          .then(this.logger.log)
          .catch(this.logger.error);
      }
    });

    api.on('ready', () => {
      this.logger.log('Substrate API ready with', apiUrl);
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

    this.logger.log(`chain: ${systemChain} (${systemChainType.toString()}), ${stringify(properties)}`);

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
