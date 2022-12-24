// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {ChainAssetMap, ChainInfoMap} from '@subwallet/extension-koni-base/services/chain-list';
import {
  _AssetType,
  _ChainAsset,
  _ChainInfo,
  _DEFAULT_NETWORKS,
  _EvmInfo,
  _SubstrateInfo
} from '@subwallet/extension-koni-base/services/chain-list/types';
import {EvmChainHandler} from '@subwallet/extension-koni-base/services/chain-service/handler/EvmChainHandler';
import {
  SubstrateChainHandler
} from '@subwallet/extension-koni-base/services/chain-service/handler/SubstrateChainHandler';
import {_CHAIN_VALIDATION_ERROR} from '@subwallet/extension-koni-base/services/chain-service/handler/types';
import {
  _ChainState,
  _ConnectionStatus,
  _CUSTOM_NETWORK_PREFIX,
  _DataMap,
  _EvmApi,
  _NetworkUpsertParams,
  _SubstrateApi
} from '@subwallet/extension-koni-base/services/chain-service/types';
import {Subject} from 'rxjs';
import Web3 from 'web3';

import {logger as createLogger} from '@polkadot/util/logger';
import {Logger} from '@polkadot/util/types';

export class ChainService {
  private dataMap: _DataMap = {
    chainInfoMap: {},
    chainStateMap: {},
    assetRegistry: {}
  };

  private lockChainInfoMap = false; // prevent unwanted changes (edit, enable, disable) to chainInfoMap

  private substrateChainHandler: SubstrateChainHandler;
  private evmChainHandler: EvmChainHandler;

  private chainInfoMapSubject = new Subject<Record<string, _ChainInfo>>();
  private chainStateMapSubject = new Subject<Record<string, _ChainState>>();
  private assetRegistrySubject = new Subject<Record<string, _ChainAsset>>();

  private logger: Logger;

  constructor () {
    this.dataMap.chainInfoMap = ChainInfoMap;
    Object.values(this.dataMap.chainInfoMap).forEach((chainInfo) => {
      this.dataMap.chainStateMap[chainInfo.slug] = {
        currentProvider: Object.keys(chainInfo.providers)[0],
        slug: chainInfo.slug,
        connectionStatus: _ConnectionStatus.DISCONNECTED,
        active: false
      };
    });

    this.dataMap.assetRegistry = ChainAssetMap;

    this.substrateChainHandler = new SubstrateChainHandler();
    this.evmChainHandler = new EvmChainHandler();

    this.chainInfoMapSubject.next(this.dataMap.chainInfoMap);
    this.chainStateMapSubject.next(this.dataMap.chainStateMap);
    this.assetRegistrySubject.next(this.dataMap.assetRegistry);

    this.logger = createLogger('chain-service');
  }

  public getChainInfoByKey (key: string) {
    return this.dataMap.chainInfoMap[key];
  }

  public initChainState () {
    const chainStateMap = this.getChainStateMap();

    _DEFAULT_NETWORKS.forEach((slug) => {
      chainStateMap[slug].active = true;
    });

    this.logger.log('Initiated with default networks');
  }

  public subscribeChainInfoMap () {
    return this.chainInfoMapSubject;
  }

  public subscribeAssetRegistry () {
    return this.assetRegistrySubject;
  }

  public subscribeChainStateMap () {
    return this.chainStateMapSubject;
  }

  public getAssetRegistry () {
    return this.dataMap.assetRegistry;
  }

  public getChainInfoMap () {
    return this.dataMap.chainInfoMap;
  }

  public getChainStateMap () {
    return this.dataMap.chainStateMap;
  }

  public removeChain (slug: string) {
    if (this.lockChainInfoMap) {
      return false;
    }

    this.lockChainInfoMap = true;

    const chainInfoMap = this.getChainInfoMap();
    const chainStateMap = this.getChainStateMap();

    if (!(slug in chainInfoMap)) {
      return false;
    }

    if (chainStateMap[slug].active) {
      return false;
    }

    delete chainStateMap[slug];
    delete chainInfoMap[slug];

    this.chainInfoMapSubject.next(this.getChainInfoMap());
    this.chainStateMapSubject.next(this.getChainStateMap());

    this.lockChainInfoMap = false;

    return true;
  }

  public updateChainActiveStatus (slug: string, active: boolean) {
    const chainStateMap = this.getChainStateMap();

    if (!Object.keys(chainStateMap).includes(slug)) {
      return false;
    }

    if (this.lockChainInfoMap) {
      return false;
    }

    this.lockChainInfoMap = true;

    chainStateMap[slug].active = active;

    this.chainStateMapSubject.next(this.getChainStateMap());

    this.lockChainInfoMap = false;

    return true;
  }

  public getSupportedSmartContractTypes () {
    return [_AssetType.ERC20, _AssetType.ERC721, _AssetType.PSP22, _AssetType.PSP34];
  }

  public resetChainInfoMap () {
    if (this.lockChainInfoMap) {
      return false;
    }

    this.lockChainInfoMap = true;

    const chainStateMap = this.getChainStateMap();

    for (const [slug, chainState] of Object.entries(chainStateMap)) {
      if (!_DEFAULT_NETWORKS.includes(slug)) {
        chainState.active = false;
      }
    }

    this.chainStateMapSubject.next(this.getChainStateMap());

    this.lockChainInfoMap = false;

    return true;
  }

  public updateChainState (slug: string, active: boolean | null, currentProvider: string | null) {
    const chainStateMap = this.getChainStateMap();

    if (active) {
      chainStateMap[slug].active = active;
    }

    if (currentProvider) {
      chainStateMap[slug].currentProvider = currentProvider;
    }

    this.chainStateMapSubject.next(this.getChainStateMap());
  }

  public upsertChainInfo (data: Record<string, any>) {
    const params = data as _NetworkUpsertParams;

    if (this.lockChainInfoMap) {
      return false;
    }

    const chainInfoMap = this.getChainInfoMap();
    const slug = params.chainEditInfo.slug;

    this.lockChainInfoMap = true;

    if (slug !== '' && slug in chainInfoMap) { // update existing chainInfo
      const targetChainInfo = chainInfoMap[slug];

      targetChainInfo.providers = params.chainEditInfo.providers;
      targetChainInfo.name = params.chainEditInfo.name;

      if (targetChainInfo.substrateInfo) {
        targetChainInfo.substrateInfo.symbol = params.chainEditInfo.symbol;
      } else if (targetChainInfo.evmInfo) {
        targetChainInfo.evmInfo.symbol = params.chainEditInfo.symbol;
      }

      this.updateChainState(params.chainEditInfo.slug, null, params.chainEditInfo.currentProvider);
    } else { // insert custom network
      const newSlug = this.generateSlugWithChainSpec(params.chainEditInfo.chainType, params.chainEditInfo.name, params.chainSpec.paraId, params.chainSpec.evmChainId);

      let substrateInfo: _SubstrateInfo | null = null;
      let evmInfo: _EvmInfo | null = null;

      if (params.chainSpec.genesisHash !== '') {
        substrateInfo = {
          addressPrefix: params.chainSpec.addressPrefix,
          blockExplorer: params.chainEditInfo.blockExplorer || null,
          category: [],
          crowdloanUrl: params.chainEditInfo.crowdloanUrl || null,
          decimals: params.chainSpec.decimals,
          existentialDeposit: params.chainSpec.existentialDeposit,
          paraId: params.chainSpec.paraId,
          symbol: params.chainEditInfo.symbol,
          genesisHash: params.chainSpec.genesisHash,
          relaySlug: null,
          supportStaking: params.chainSpec.paraId === null,
          supportSmartContract: null
        };
      } else if (params.chainSpec.evmChainId !== null) {
        evmInfo = {
          supportSmartContract: [_AssetType.ERC20, _AssetType.ERC721],
          blockExplorer: params.chainEditInfo.blockExplorer || null,
          decimals: params.chainSpec.decimals,
          evmChainId: params.chainSpec.evmChainId,
          existentialDeposit: params.chainSpec.existentialDeposit,
          symbol: params.chainEditInfo.symbol
        };
      }

      // insert new chainInfo
      chainInfoMap[newSlug] = {
        slug: newSlug,
        name: params.chainEditInfo.name,
        providers: params.chainEditInfo.providers,
        substrateInfo,
        evmInfo,
        logo: ''
      };

      // insert new chainState
      const chainStateMap = this.getChainStateMap();

      chainStateMap[newSlug] = {
        active: true,
        connectionStatus: _ConnectionStatus.DISCONNECTED,
        currentProvider: params.chainEditInfo.currentProvider,
        slug: newSlug
      };

      this.chainStateMapSubject.next(this.getChainStateMap());
    }

    this.chainInfoMapSubject.next(this.getChainInfoMap());

    this.lockChainInfoMap = false;

    return true;
  }

  private generateSlugWithChainSpec (chainType: string, name: string, paraId: number | null, evmChainId: number | null) {
    const parsedName = name.replaceAll(' ', '').toLowerCase();

    if (evmChainId !== null) {
      return `${_CUSTOM_NETWORK_PREFIX}${chainType}-${parsedName}-${evmChainId}`;
    } else {
      let slug = `${_CUSTOM_NETWORK_PREFIX}${chainType}-${parsedName}`;

      if (paraId !== null) {
        slug = slug.concat(`-${paraId}`);
      }

      return slug;
    }
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
