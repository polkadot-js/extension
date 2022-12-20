// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainInfoMap } from '@subwallet/extension-koni-base/services/chain-list';
import { _ChainInfo, _DEFAULT_NETWORKS } from '@subwallet/extension-koni-base/services/chain-list/types';
import { EvmChainHandler } from '@subwallet/extension-koni-base/services/chain-service/handler/EvmChainHandler';
import { SubstrateChainHandler } from '@subwallet/extension-koni-base/services/chain-service/handler/SubstrateChainHandler';
import { _CHAIN_VALIDATION_ERROR } from '@subwallet/extension-koni-base/services/chain-service/handler/types';
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

  public getChainInfoByKey (key: string) {
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

  public upsertChainInfo (data: Record<string, any>) {
    console.log('got data', data);

    return false;
  }

  public async validateCustomChain (provider: string, existingChainSlug?: string) {
    // currently only supports WS provider for Substrate and HTTP provider for EVM
    let result: Record<string, any> = {
      decimals: 0,
      existentialDeposit: '',
      paraId: null,
      symbol: '',
      success: false,
      genesisHash: '',
      addressPrefix: '',
      name: '',
      evmChainId: null
    };

    try {
      const { conflictChainName: providerConflictChainName, conflictChainSlug: providerConflictChainSlug, error: providerError } = this.validateProvider(provider, existingChainSlug);

      if (providerError === _CHAIN_VALIDATION_ERROR.NONE) {
        let api: _EvmApi | _SubstrateApi;

        if (provider.startsWith('http')) {
          // HTTP provider is EVM by default
          api = this.evmChainHandler.initApi('custom', provider);
        } else {
          api = this.substrateChainHandler.initApi('custom', provider);
        }

        const connectionTimeout = new Promise((resolve) => {
          const id = setTimeout(() => {
            clearTimeout(id);
            resolve(null);
          }, 5000);
        });

        const connectionTrial = await Promise.race([
          connectionTimeout,
          api.isReady
        ]); // check connection

        if (connectionTrial !== null) {
          const _api = connectionTrial as _SubstrateApi | _EvmApi;

          const chainSpec = await this.getChainSpecByProvider(_api);

          result = Object.assign(result, chainSpec);

          if (existingChainSlug) {
            // check if same network (with existingChainSlug)
            const existedChainInfo = this.getChainInfoByKey(existingChainSlug);

            if (existedChainInfo.evmInfo !== null) {
              if (result.evmChainId !== existedChainInfo.evmInfo.evmChainId) {
                result.error = _CHAIN_VALIDATION_ERROR.PROVIDER_NOT_SAME_CHAIN as string;
              }
            } else if (existedChainInfo.substrateInfo !== null) {
              if (result.genesisHash !== existedChainInfo.substrateInfo.genesisHash) {
                result.error = _CHAIN_VALIDATION_ERROR.PROVIDER_NOT_SAME_CHAIN as string;
              }
            }
          } else {
            // check if network existed
            if (result.evmChainId !== null) {
              for (const chainInfo of Object.values(this.getChainInfoMap())) {
                if (chainInfo.evmInfo !== null && chainInfo.evmInfo.evmChainId === result.evmChainId) {
                  result.error = _CHAIN_VALIDATION_ERROR.EXISTED_CHAIN as string;
                  result.conflictChainName = chainInfo.name;
                  result.conflictChainSlug = chainInfo.slug;

                  break;
                }
              }
            } else if (result.genesisHash !== '') {
              for (const chainInfo of Object.values(this.getChainInfoMap())) {
                if (chainInfo.substrateInfo !== null && chainInfo.substrateInfo.genesisHash === result.genesisHash) {
                  result.error = _CHAIN_VALIDATION_ERROR.EXISTED_CHAIN as string;
                  result.conflictChainName = chainInfo.name;
                  result.conflictChainSlug = chainInfo.slug;

                  break;
                }
              }
            }
          }
        } else {
          result.error = _CHAIN_VALIDATION_ERROR.CONNECTION_FAILURE as string;
          result.success = false;
        }
      } else {
        result.success = false;
        result.error = providerError as string;
        result.conflictChainName = providerConflictChainName;
        result.conflictChainSlug = providerConflictChainSlug;
      }

      if (!result.error && (result.evmChainId !== null || result.genesisHash !== '')) {
        result.success = true;
      }

      return result;
    } catch (e) {
      console.error('Error connecting to provider', e);

      result.success = false;
      result.error = _CHAIN_VALIDATION_ERROR.CONNECTION_FAILURE as string;

      return result;
    }
  }

  private async getChainSpecByProvider (api: _EvmApi | _SubstrateApi) {
    if (api.api instanceof Web3) {
      return await this.evmChainHandler.getChainSpec(api as _EvmApi);
    }

    return await this.substrateChainHandler.getChainSpec(api as _SubstrateApi);
  }

  private validateProvider (targetProvider: string, existingChainSlug?: string) {
    let error: _CHAIN_VALIDATION_ERROR = _CHAIN_VALIDATION_ERROR.NONE;
    const chainInfoMap = this.getChainInfoMap();
    const allExistedProviders: Record<string, string | boolean>[] = [];
    let conflictChainSlug = '';
    let conflictChainName = '';

    if (existingChainSlug) {
      const chainInfo = chainInfoMap[existingChainSlug];

      if (Object.values(chainInfo.providers).includes(targetProvider)) {
        error = _CHAIN_VALIDATION_ERROR.EXISTED_CHAIN;
        conflictChainSlug = chainInfo.slug;
        conflictChainName = chainInfo.name;
      }

      return { error, conflictChainSlug, conflictChainName };
    }

    // get all providers
    for (const [key, value] of Object.entries(chainInfoMap)) {
      Object.values(value.providers).forEach((provider) => {
        allExistedProviders.push({ key, provider });
      });
    }

    for (const { key, provider } of allExistedProviders) {
      if (provider === targetProvider) {
        error = _CHAIN_VALIDATION_ERROR.EXISTED_CHAIN;
        conflictChainSlug = key as string;
        conflictChainName = chainInfoMap[key as string].name;
        break;
      }
    }

    return { error, conflictChainSlug, conflictChainName };
  }
}
