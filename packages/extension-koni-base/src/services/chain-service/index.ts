// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainInfoMap } from '@subwallet/extension-koni-base/services/chain-list';
import { _ChainInfo, _DEFAULT_NETWORKS } from '@subwallet/extension-koni-base/services/chain-list/types';
import { EvmChainHandler } from '@subwallet/extension-koni-base/services/chain-service/handler/EvmChainHandler';
import { SubstrateChainHandler } from '@subwallet/extension-koni-base/services/chain-service/handler/SubstrateChainHandler';
import {
  _CHAIN_VALIDATION_ERROR,
  _SubstrateChainSpec
} from '@subwallet/extension-koni-base/services/chain-service/handler/types';
import { _ChainState, _DataMap, _EvmApi, _SubstrateApi, ConnectionStatus } from '@subwallet/extension-koni-base/services/chain-service/types';
import { Subject } from 'rxjs';
import Web3 from 'web3';

import { logger as createLogger } from '@polkadot/util/logger';
import { Logger } from '@polkadot/util/types';

export class ChainService {
  private dataMap: _DataMap = {
    chainInfoMap: {},
    chainStateMap: {}
  };

  private substrateChainHandler: SubstrateChainHandler;
  private evmChainHandler: EvmChainHandler;

  private chainInfoMapSubject = new Subject<Record<string, _ChainInfo>>();
  private chainStateMapSubject = new Subject<Record<string, _ChainState>>();

  private logger: Logger;

  constructor () {
    this.dataMap.chainInfoMap = ChainInfoMap;
    Object.values(this.dataMap.chainInfoMap).forEach((chainInfo) => {
      this.dataMap.chainStateMap[chainInfo.slug] = {
        currentProvider: Object.keys(chainInfo.providers)[0],
        slug: chainInfo.slug,
        connectionStatus: ConnectionStatus.DISCONNECTED,
        active: false
      };
    });

    this.substrateChainHandler = new SubstrateChainHandler();
    this.evmChainHandler = new EvmChainHandler();

    this.chainInfoMapSubject.next(this.dataMap.chainInfoMap);
    this.chainStateMapSubject.next(this.dataMap.chainStateMap);

    this.logger = createLogger('chain-service');
  }

  public getChainInfoMapByKey (key: string) {
    return this.dataMap.chainInfoMap[key];
  }

  public initChainMap () {
    _DEFAULT_NETWORKS.forEach((slug) => {
      this.dataMap.chainStateMap[slug].active = true;
    });

    this.logger.log('Initiated with default networks');
  }

  public subscribeChainInfoMap () {
    return this.chainInfoMapSubject;
  }

  public subscribeChainStateMap () {
    return this.chainStateMapSubject;
  }

  public getChainInfoMap () {
    return this.dataMap.chainInfoMap;
  }

  public getChainStateMap () {
    return this.dataMap.chainStateMap;
  }

  public getActiveChains (): string[] {
    const activeChains: string[] = [];

    Object.values(this.dataMap.chainStateMap).forEach((chainState) => {
      if (chainState.active) {
        activeChains.push(chainState.slug);
      }
    });

    return activeChains;
  }

  private validateProvider (targetProvider: string) {
    let error: _CHAIN_VALIDATION_ERROR = _CHAIN_VALIDATION_ERROR.NONE;
    const chainInfoMap = this.getChainInfoMap();
    const allExistedProviders: Record<string, string | boolean>[] = [];
    let conflictChainSlug = '';
    let conflictChainName = '';

    // get all providers
    for (const [key, value] of Object.entries(chainInfoMap)) {
      Object.values(value.providers).forEach((provider) => {
        allExistedProviders.push({ key, provider });
      });
    }

    for (const { key, provider } of allExistedProviders) {
      if (provider === targetProvider) {
        error = _CHAIN_VALIDATION_ERROR.EXISTED_PROVIDER;
        conflictChainSlug = key as string;
        conflictChainName = chainInfoMap[key as string].name;
        break;
      }
    }

    return { error, conflictChainSlug, conflictChainName };
  }

  public async validateCustomChain (provider: string, existedChainSlug?: string) {
    // currently only supports WS provider for Substrate and HTTP provider for EVM
    const result: Record<string, any> = {
      decimals: 0,
      existentialDeposit: '',
      paraId: null,
      symbol: '',
      success: false,
      slug: '',
      genesisHash: '',
      addressPrefix: '',
      name: '',
      evmChainId: null
    };

    try {
      const { conflictChainName: providerConflictChainName, conflictChainSlug: providerConflictChainSlug, error: providerError } = this.validateProvider(provider);

      if (providerError === _CHAIN_VALIDATION_ERROR.NONE) {
        let api: _EvmApi | _SubstrateApi;

        if (provider.startsWith('http')) {
          // EVM by default
          api = this.evmChainHandler.initApi('custom', provider);
        } else {
          api = this.substrateChainHandler.initApi('custom', provider);
        }

        const connectionTimeout = new Promise((resolve) => {
          const id = setTimeout(() => {
            clearTimeout(id);
            resolve(null);
          }, 3000);
        });

        const connectionTrial = await Promise.race([
          connectionTimeout,
          api.isReady
        ]); // check connection

        if (connectionTrial !== null) {
          const _api = connectionTrial as _SubstrateApi | _EvmApi;

          const chainSpec = await this.getChainSpecByProvider(_api);

          console.log(chainSpec);
        }
      } else {
        result.error = providerError;
        result.conflictChainName = providerConflictChainName;
        result.conflictChainSlug = providerConflictChainSlug;
      }

      return result;
    } catch (e) {
      console.error('Error connecting to provider', e);

      return result;
    }
  }

  private async getChainSpecByProvider (api: _EvmApi | _SubstrateApi) {
    if (api.api instanceof Web3) {
      return await this.evmChainHandler.getChainSpec(api as _EvmApi);
    }

    return await this.substrateChainHandler.getChainSpec(api as _SubstrateApi);
  }
}
