// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _AssetType } from '@subwallet/chain-list/types';
import { getDefaultWeightV2 } from '@subwallet/extension-base/koni/api/tokens/wasm/utils';
import { SubstrateApi } from '@subwallet/extension-base/services/chain-service/handler/SubstrateApi';
import { _SubstrateChainSpec } from '@subwallet/extension-base/services/chain-service/handler/types';
import { _SmartContractTokenInfo, _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { BehaviorSubject } from 'rxjs';

import { ContractPromise } from '@polkadot/api-contract';
import { BN } from '@polkadot/util';
import { logger as createLogger } from '@polkadot/util/logger';
import { Logger } from '@polkadot/util/types';

import { _PSP22_ABI, _PSP34_ABI } from '../helper';

export const DEFAULT_AUX = ['Aux1', 'Aux2', 'Aux3', 'Aux4', 'Aux5', 'Aux6', 'Aux7', 'Aux8', 'Aux9'];

export class SubstrateChainHandler {
  private substrateApiMap: Record<string, _SubstrateApi> = {};
  private logger: Logger;
  readonly apiStateMapSubject = new BehaviorSubject<Record<string, boolean>>({});

  constructor () {
    this.logger = createLogger('substrate-chain-handler');
  }

  public getSubstrateApiMap () {
    return this.substrateApiMap;
  }

  public getSubstrateApiByChain (chainSlug: string) {
    return this.substrateApiMap[chainSlug];
  }

  public resumeAllApis () {
    return Promise.all(Object.values(this.getSubstrateApiMap()).map(async (substrateApi) => {
      if (!substrateApi.api.isConnected && substrateApi.api.connect) {
        await substrateApi.api.connect();
      }
    }));
  }

  public disconnectAllApis () {
    return Promise.all(Object.values(this.getSubstrateApiMap()).map(async (substrateApi) => {
      if (substrateApi.api.isConnected) {
        substrateApi.api?.disconnect && await substrateApi.api?.disconnect();
      }
    }));
  }

  public refreshApi (slug: string) {
    const substrateApi = this.getSubstrateApiByChain(slug);

    if (substrateApi && !substrateApi.isApiConnected) {
      substrateApi.recoverConnect && substrateApi.recoverConnect();
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

  public setSubstrateApi (chainSlug: string, substrateApi: _SubstrateApi) {
    this.substrateApiMap[chainSlug] = substrateApi;
  }

  public destroySubstrateApi (chainSlug: string) {
    const substrateAPI = this.substrateApiMap[chainSlug];

    if (!substrateAPI) {
      return;
    }

    substrateAPI.destroy();
  }

  public initApi (chainSlug: string, apiUrl: string, providerName?: string): _SubstrateApi {
    const exsited = this.substrateApiMap[chainSlug];

    // Return existed to avoid re-init metadata
    if (exsited) {
      exsited.connect();

      return exsited;
    }

    const apiObject = new SubstrateApi(apiUrl, apiUrl, providerName);

    apiObject.isApiConnectedSubject.subscribe((isConnected) => {
      const currentMap = this.apiStateMapSubject.getValue();

      this.apiStateMapSubject.next({
        ...currentMap,
        [chainSlug]: isConnected
      });
    });

    return apiObject;
  }
}
