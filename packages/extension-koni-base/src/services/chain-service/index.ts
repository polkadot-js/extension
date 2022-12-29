// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _DEFAULT_CHAINS, ChainAssetMap, ChainInfoMap } from '@subwallet/chain';
import { _AssetType, _ChainAsset, _ChainInfo, _EvmInfo, _SubstrateInfo } from '@subwallet/chain/types';
import { IChain } from '@subwallet/extension-koni-base/databases';
import { EvmChainHandler } from '@subwallet/extension-koni-base/services/chain-service/handler/EvmChainHandler';
import { SubstrateChainHandler } from '@subwallet/extension-koni-base/services/chain-service/handler/SubstrateChainHandler';
import { _CHAIN_VALIDATION_ERROR } from '@subwallet/extension-koni-base/services/chain-service/handler/types';
import { _ChainState, _ChainStorageInfo, _ConnectionStatus, _CUSTOM_NETWORK_PREFIX, _DataMap, _EvmApi, _NetworkUpsertParams, _SMART_CONTRACT_STANDARDS, _SmartContractTokenInfo, _SubstrateApi, _ValidateCustomTokenRequest, _ValidateCustomTokenResponse } from '@subwallet/extension-koni-base/services/chain-service/types';
import { _isEqualContractAddress } from '@subwallet/extension-koni-base/services/chain-service/utils';
import DatabaseService from '@subwallet/extension-koni-base/services/DatabaseService';
import { Subject } from 'rxjs';
import Web3 from 'web3';

import { logger as createLogger } from '@polkadot/util/logger';
import { Logger } from '@polkadot/util/types';

export class ChainService {
  private dataMap: _DataMap = {
    chainInfoMap: {},
    chainStateMap: {},
    assetRegistry: {}
  };

  private dbService: DatabaseService; // to save chain, token settings from user

  private lockChainInfoMap = false; // prevent unwanted changes (edit, enable, disable) to chainInfoMap

  private substrateChainHandler: SubstrateChainHandler;
  private evmChainHandler: EvmChainHandler;

  private chainInfoMapSubject = new Subject<Record<string, _ChainInfo>>();
  private chainStateMapSubject = new Subject<Record<string, _ChainState>>();
  private assetRegistrySubject = new Subject<Record<string, _ChainAsset>>();

  private logger: Logger;

  constructor (dbService: DatabaseService) {
    this.dbService = dbService;

    this.substrateChainHandler = new SubstrateChainHandler();
    this.evmChainHandler = new EvmChainHandler();

    this.chainInfoMapSubject.next(this.dataMap.chainInfoMap);
    this.chainStateMapSubject.next(this.dataMap.chainStateMap);
    this.assetRegistrySubject.next(this.dataMap.assetRegistry);

    this.logger = createLogger('chain-service');
  }

  public getChainInfoByKey (key: string): _ChainInfo {
    return this.dataMap.chainInfoMap[key];
  }

  public init () {
    this.initChains().catch((e) => this.logger.error(e));
    this.dataMap.assetRegistry = ChainAssetMap;

    this.initStorage().catch((e) => this.logger.error(e));

    this.logger.log('Initiated with default networks');
  }

  private async initChains () {
    const chainStoredSettings = await this.dbService.getAllChainStore();

    console.log('chainStoredSettings', chainStoredSettings);

    const chainStoredSettingMap: Record<string, IChain> = {};

    chainStoredSettings.forEach((chainStoredSetting) => {
      chainStoredSettingMap[chainStoredSetting.slug] = chainStoredSetting;
    });

    console.log('processing');

    if (chainStoredSettings.length === 0) {
      const storageData: IChain[] = [];

      this.dataMap.chainInfoMap = ChainInfoMap;
      Object.values(ChainInfoMap).forEach((chainInfo) => {
        this.dataMap.chainStateMap[chainInfo.slug] = {
          currentProvider: Object.keys(chainInfo.providers)[0],
          slug: chainInfo.slug,
          connectionStatus: _ConnectionStatus.DISCONNECTED,
          active: _DEFAULT_CHAINS.includes(chainInfo.slug)
        };

        // create data for storage
        storageData.push({
          ...chainInfo,
          active: _DEFAULT_CHAINS.includes(chainInfo.slug),
          currentProvider: Object.keys(chainInfo.providers)[0]
        });
      });

      await this.dbService.bulkUpdateChainStore(storageData);
    } else {
      const mergedChainInfoMap: Record<string, _ChainInfo> = ChainInfoMap;

      for (const [storedSlug, storedChainInfo] of Object.entries(chainStoredSettingMap)) {
        if (storedSlug in ChainInfoMap) { // check predefined chains first, update providers, active and currentProvider
          mergedChainInfoMap[storedSlug].providers = { ...storedChainInfo.providers, ...mergedChainInfoMap[storedSlug].providers };
          this.dataMap.chainStateMap[storedSlug] = {
            currentProvider: storedChainInfo.currentProvider,
            slug: storedSlug,
            connectionStatus: _ConnectionStatus.DISCONNECTED,
            active: _DEFAULT_CHAINS.includes(storedSlug) || storedChainInfo.active
          };

          console.log('got predefined', mergedChainInfoMap[storedSlug], this.dataMap.chainStateMap[storedSlug]);
        } else { // only custom chains are left
          // check custom chain duplicated with predefined chain => merge into predefined chain
          const duplicatedPredefinedSlug = this.checkExistedPredefinedChain(storedChainInfo.substrateInfo?.genesisHash, storedChainInfo.evmInfo?.evmChainId);

          if (duplicatedPredefinedSlug.length > 0) { // merge custom chain with existed chain
            mergedChainInfoMap[duplicatedPredefinedSlug].providers = { ...storedChainInfo.providers, ...mergedChainInfoMap[duplicatedPredefinedSlug].providers };
            this.dataMap.chainStateMap[duplicatedPredefinedSlug] = {
              currentProvider: storedChainInfo.currentProvider,
              slug: duplicatedPredefinedSlug,
              connectionStatus: _ConnectionStatus.DISCONNECTED,
              active: _DEFAULT_CHAINS.includes(storedSlug) || storedChainInfo.active
            };

            console.log('got duplicated', mergedChainInfoMap[duplicatedPredefinedSlug], this.dataMap.chainStateMap[duplicatedPredefinedSlug]);
          } else {
            mergedChainInfoMap[storedSlug] = {
              slug: storedSlug,
              name: storedChainInfo.name,
              providers: storedChainInfo.providers,
              logo: storedChainInfo.logo,
              evmInfo: storedChainInfo.evmInfo,
              substrateInfo: storedChainInfo.substrateInfo
            };
            this.dataMap.chainStateMap[storedSlug] = {
              currentProvider: storedChainInfo.currentProvider,
              slug: storedSlug,
              connectionStatus: _ConnectionStatus.DISCONNECTED,
              active: _DEFAULT_CHAINS.includes(storedSlug) || storedChainInfo.active
            };

            console.log('got custom', mergedChainInfoMap[storedSlug], this.dataMap.chainStateMap[storedSlug]);
          }
        }
      }

      console.log('mergedChainInfoMap', mergedChainInfoMap);
    }
  }

  private checkExistedPredefinedChain (genesisHash?: string, evmChainId?: number) {
    let duplicatedSlug = '';

    if (genesisHash) {
      Object.values(ChainInfoMap).forEach((chainInfo) => {
        if (chainInfo.substrateInfo && chainInfo.substrateInfo.genesisHash === genesisHash) {
          duplicatedSlug = chainInfo.slug;
        }
      });
    } else if (evmChainId) {
      Object.values(ChainInfoMap).forEach((chainInfo) => {
        if (chainInfo.evmInfo && chainInfo.evmInfo.evmChainId === evmChainId) {
          duplicatedSlug = chainInfo.slug;
        }
      });
    }

    return duplicatedSlug;
  }

  private async initAssetRegistry () {

  }

  private async initStorage () {
    const chainStoreData: _ChainStorageInfo[] = [];
    const chainInfoMap = this.getChainInfoMap();
    const assetRegistryMap = this.getAssetRegistry();

    Object.values(chainInfoMap).forEach((chainInfo) => {
      chainStoreData.push({
        slug: chainInfo.slug,
        name: chainInfo.name,
        providers: chainInfo.providers,
        currentProvider: this.getChainCurrentProviderByKey(chainInfo.slug)
      });
    });

    await Promise.all([
      this.dbService.bulkUpdateChainStore(chainStoreData),
      this.dbService.bulkUpdateAssetStore(Object.values(assetRegistryMap))
    ]);
  }

  public getChainCurrentProviderByKey (slug: string) {
    return this.getChainStateMap()[slug].currentProvider;
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

  public getSmartContractTokens () {
    const filteredAssetRegistry: Record<string, _ChainAsset> = {};

    Object.values(this.getAssetRegistry()).forEach((asset) => {
      if (_SMART_CONTRACT_STANDARDS.includes(asset.assetType)) {
        filteredAssetRegistry[asset.slug] = asset;
      }
    });

    return filteredAssetRegistry;
  }

  public getChainInfoMap (): Record<string, _ChainInfo> {
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
      if (!_DEFAULT_CHAINS.includes(slug)) {
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
      const newSlug = this.generateSlugForChain(params.chainEditInfo.chainType, params.chainEditInfo.name, params.chainSpec.paraId, params.chainSpec.evmChainId);

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

      // create a record in assetRegistry for native token
      this.upsertCustomToken({
        assetType: _AssetType.NATIVE,
        decimals: params.chainSpec.decimals,
        metadata: null,
        minAmount: params.chainSpec.existentialDeposit,
        multiChainAsset: null,
        name: params.chainEditInfo.name,
        originChain: newSlug,
        priceId: null,
        slug: '',
        symbol: params.chainEditInfo.symbol
      });

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

  private generateSlugForChain (chainType: string, name: string, paraId: number | null, evmChainId: number | null) {
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

  private async getSmartContractTokenInfo (contractAddress: string, tokenType: _AssetType, originChain: string, contractCaller?: string): Promise<_SmartContractTokenInfo> {
    if ([_AssetType.ERC721, _AssetType.ERC20].includes(tokenType)) {
      return await this.evmChainHandler.getSmartContractTokenInfo(contractAddress, tokenType, originChain);
    } else if ([_AssetType.PSP34, _AssetType.PSP22].includes(tokenType)) {
      return await this.substrateChainHandler.getSmartContractTokenInfo(contractAddress, tokenType, originChain, contractCaller);
    }

    return {
      decimals: -1,
      name: '',
      symbol: '',
      contractError: false
    };
  }

  public async validateCustomToken (data: _ValidateCustomTokenRequest): Promise<_ValidateCustomTokenResponse> {
    const assetRegistry = this.getSmartContractTokens();
    let isExist = false;

    for (const token of Object.values(assetRegistry)) {
      const contractAddress = token?.metadata?.contractAddress as string;

      if (_isEqualContractAddress(contractAddress, data.contractAddress) && token.assetType === data.type && token.originChain === data.originChain) {
        isExist = true;
        break;
      }
    }

    if (isExist) {
      return {
        decimals: -1,
        name: '',
        symbol: '',
        isExist,
        contractError: false
      };
    }

    const { contractError, decimals, name, symbol } = await this.getSmartContractTokenInfo(data.contractAddress, data.type, data.originChain, data.contractCaller);

    return {
      name,
      decimals,
      symbol,
      isExist,
      contractError
    };
  }

  private generateSlugForToken (originChain: string, assetType: _AssetType, symbol: string, contractAddress: string) {
    return `${originChain}-${assetType}-${symbol}-${contractAddress}`;
  }

  public upsertCustomToken (token: _ChainAsset) {
    if (token.slug.length === 0) { // new token
      token.slug = this.generateSlugForToken(token.originChain, token.assetType, token.symbol, token.metadata?.contractAddress as string);
    }

    const assetRegistry = this.getAssetRegistry();

    assetRegistry[token.slug] = token;

    this.assetRegistrySubject.next(assetRegistry);
  }

  public deleteCustomTokens (targetTokens: string[]) {
    const assetRegistry = this.getAssetRegistry();

    targetTokens.forEach((targetToken) => {
      delete assetRegistry[targetToken];
    });

    this.assetRegistrySubject.next(assetRegistry);
  }
}
