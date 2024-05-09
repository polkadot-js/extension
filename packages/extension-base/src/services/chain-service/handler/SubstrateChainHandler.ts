// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _AssetType } from '@subwallet/chain-list/types';
import { getDefaultWeightV2 } from '@subwallet/extension-base/koni/api/tokens/wasm/utils';
import { ChainService } from '@subwallet/extension-base/services/chain-service';
import { AbstractChainHandler } from '@subwallet/extension-base/services/chain-service/handler/AbstractChainHandler';
import { SubstrateApi } from '@subwallet/extension-base/services/chain-service/handler/SubstrateApi';
import { _ApiOptions, _SubstrateChainSpec } from '@subwallet/extension-base/services/chain-service/handler/types';
import { _SmartContractTokenInfo, _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';

import { ContractPromise } from '@polkadot/api-contract';
import { getSpecExtensions, getSpecTypes } from '@polkadot/types-known';
import { BN } from '@polkadot/util';
import { logger as createLogger } from '@polkadot/util/logger';
import { Logger } from '@polkadot/util/types';

import { _PSP22_ABI, _PSP34_ABI } from '../helper';

export const DEFAULT_AUX = ['Aux1', 'Aux2', 'Aux3', 'Aux4', 'Aux5', 'Aux6', 'Aux7', 'Aux8', 'Aux9'];

export class SubstrateChainHandler extends AbstractChainHandler {
  private substrateApiMap: Record<string, SubstrateApi> = {};

  private logger: Logger;

  constructor (parent?: ChainService) {
    super(parent);
    this.logger = createLogger('substrate-chain-handler');
  }

  public getSubstrateApiMap () {
    return this.substrateApiMap;
  }

  public getSubstrateApiByChain (chainSlug: string) {
    return this.substrateApiMap[chainSlug];
  }

  public getApiByChain (chain: string) {
    return this.getSubstrateApiByChain(chain);
  }

  public async wakeUp () {
    this.isSleeping = false;
    const activeChains = this.parent?.getActiveChains() || [];

    for (const chain of activeChains) {
      const api = this.getSubstrateApiByChain(chain);

      // Not found substrateInterface mean it active with evm interface
      if (api) {
        api.connect();

        if (!api.useLightClient) {
          // Manual fire handle connect to avoid some chain can not reconnect
          setTimeout(() => {
            this.handleConnection(chain, api.connectionStatus);
          }, 10000);
        }
      }
    }

    return Promise.resolve();
  }

  public async sleep () {
    this.isSleeping = true;
    this.cancelAllRecover();

    await Promise.all(Object.values(this.getSubstrateApiMap()).map((substrateApi) => {
      return substrateApi.disconnect().catch(console.error);
    }));
  }

  async recoverApi (chainSlug: string) {
    const existed = this.getSubstrateApiByChain(chainSlug);

    if (existed && !existed.isApiReadyOnce) {
      console.log(`Reconnect ${existed.providerName || existed.chainSlug} at ${existed.apiUrl}`);

      return existed.recoverConnect();
    }
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
          tokenContract.query['psp22Metadata::tokenName'](contractCaller || contractAddress, { gasLimit: getDefaultWeightV2(substrateApi.api) }), // read-only operation so no gas limit
          tokenContract.query['psp22Metadata::tokenSymbol'](contractCaller || contractAddress, { gasLimit: getDefaultWeightV2(substrateApi.api) }),
          tokenContract.query['psp22Metadata::tokenDecimals'](contractCaller || contractAddress, { gasLimit: getDefaultWeightV2(substrateApi.api) })
        ]);

        if (!(nameResp.result.isOk && symbolResp.result.isOk && decimalsResp.result.isOk) || !nameResp.output || !decimalsResp.output || !symbolResp.output) {
          return {
            name: '',
            decimals: -1,
            symbol: '',
            contractError: true
          };
        } else {
          const symbolObj = symbolResp.output?.toHuman() as Record<string, any>;
          const decimalsObj = decimalsResp.output?.toHuman() as Record<string, any>;
          const nameObj = nameResp.output?.toHuman() as Record<string, any>;

          name = nameResp.output ? (nameObj.Ok as string || nameObj.ok as string) : '';
          decimals = decimalsResp.output ? (new BN((decimalsObj.Ok || decimalsObj.ok) as string | number)).toNumber() : 0;
          symbol = decimalsResp.output ? (symbolObj.Ok as string || symbolObj.ok as string) : '';

          if (!name || !symbol || typeof name === 'object' || typeof symbol === 'object') {
            contractError = true;
          }

          console.log('validate PSP22', name, symbol, decimals);
        }
      } else {
        tokenContract = new ContractPromise(substrateApi.api, _PSP34_ABI, contractAddress);

        const collectionIdResp = await tokenContract.query['psp34::collectionId'](contractCaller || contractAddress, { gasLimit: getDefaultWeightV2(substrateApi.api) }); // read-only operation so no gas limit

        if (!collectionIdResp.result.isOk || !collectionIdResp.output) {
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
      this.logger.error(e);

      return {
        name: '',
        decimals: -1,
        symbol: '',
        contractError: true
      };
    }
  }

  public setSubstrateApi (chainSlug: string, substrateApi: SubstrateApi) {
    this.substrateApiMap[chainSlug] = substrateApi;
  }

  public destroySubstrateApi (chainSlug: string) {
    const substrateAPI = this.substrateApiMap[chainSlug];

    substrateAPI?.destroy().catch(console.error);
  }

  public async initApi (chainSlug: string, apiUrl: string, { externalApiPromise, onUpdateStatus, providerName }: Omit<_ApiOptions, 'metadata'> = {}): Promise<SubstrateApi> {
    const existed = this.substrateApiMap[chainSlug];
    const metadata = await this.parent?.getMetadata(chainSlug);

    const updateMetadata = (substrateApi: SubstrateApi) => {
      // Update metadata to database with async methods
      substrateApi.api.isReady.then(async (api) => {
        const currentSpecVersion = api.runtimeVersion.specVersion.toString();
        const genesisHash = api.genesisHash.toHex();

        // Avoid date existed metadata
        if (metadata && metadata.specVersion === currentSpecVersion && metadata.genesisHash === genesisHash) {
          return;
        }

        const systemChain = await api.rpc.system.chain();

        this.parent?.upsertMetadata(chainSlug, {
          chain: chainSlug,
          genesisHash: genesisHash,
          specVersion: currentSpecVersion,
          hexValue: api.runtimeMetadata.asCallsOnly.toHex(), // Shorten metadata to save space
          types: getSpecTypes(api.registry, systemChain, api.runtimeVersion.specName, api.runtimeVersion.specVersion) as unknown as Record<string, string>,
          userExtensions: getSpecExtensions(api.registry, systemChain, api.runtimeVersion.specName)
        }).catch(console.error);
      }).catch(console.error);
    };

    // Return existed to avoid re-init metadata
    if (existed) {
      existed.connect();

      if (apiUrl !== existed.apiUrl) {
        await existed.updateApiUrl(apiUrl);
      }

      // Update data in case of existed api (if needed - old provider cannot connect)
      updateMetadata(existed);

      return existed;
    }

    const apiObject = new SubstrateApi(chainSlug, apiUrl, { providerName, metadata, externalApiPromise });

    apiObject.connectionStatusSubject.subscribe(this.handleConnection.bind(this, chainSlug));
    onUpdateStatus && apiObject.connectionStatusSubject.subscribe(onUpdateStatus);

    updateMetadata(apiObject);

    return apiObject;
  }
}
