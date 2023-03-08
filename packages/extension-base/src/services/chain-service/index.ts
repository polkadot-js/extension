// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AssetRefMap, ChainAssetMap, ChainInfoMap, MultiChainAssetMap } from '@subwallet/chain-list';
import { _AssetRefPath, _AssetType, _ChainAsset, _ChainInfo, _ChainStatus, _EvmInfo, _MultiChainAsset, _SubstrateChainType, _SubstrateInfo } from '@subwallet/chain-list/types';
import { ValidateNetworkResponse } from '@subwallet/extension-base/background/KoniTypes';
import { _DEFAULT_ACTIVE_CHAINS } from '@subwallet/extension-base/services/chain-service/constants';
import { EvmChainHandler } from '@subwallet/extension-base/services/chain-service/handler/EvmChainHandler';
import { SubstrateChainHandler } from '@subwallet/extension-base/services/chain-service/handler/SubstrateChainHandler';
import { _CHAIN_VALIDATION_ERROR } from '@subwallet/extension-base/services/chain-service/handler/types';
import { _ChainBaseApi, _ChainConnectionStatus, _ChainState, _CUSTOM_PREFIX, _DataMap, _EvmApi, _NetworkUpsertParams, _NFT_CONTRACT_STANDARDS, _SMART_CONTRACT_STANDARDS, _SmartContractTokenInfo, _SubstrateApi, _ValidateCustomAssetRequest, _ValidateCustomAssetResponse } from '@subwallet/extension-base/services/chain-service/types';
import { _getChainNativeTokenSlug, _isAssetFungibleToken, _isChainEnabled, _isCustomAsset, _isCustomChain, _isEqualContractAddress, _isEqualSmartContractAsset, _isPureEvmChain, _isPureSubstrateChain, _parseAssetRefKey } from '@subwallet/extension-base/services/chain-service/utils';
import { IChain } from '@subwallet/extension-base/services/storage-service/databases';
import DatabaseService from '@subwallet/extension-base/services/storage-service/DatabaseService';
import { Subject } from 'rxjs';
import Web3 from 'web3';

import { logger as createLogger } from '@polkadot/util/logger';
import { Logger } from '@polkadot/util/types';

export class ChainService {
  private dataMap: _DataMap = {
    chainInfoMap: {},
    chainStateMap: {},
    assetRegistry: {},
    assetRefMap: {}
  };

  private dbService: DatabaseService; // to save chain, token settings from user

  private lockChainInfoMap = false; // prevent unwanted changes (edit, enable, disable) to chainInfoMap

  private substrateChainHandler: SubstrateChainHandler;
  private evmChainHandler: EvmChainHandler;

  // TODO: consider BehaviorSubject
  private chainInfoMapSubject = new Subject<Record<string, _ChainInfo>>();
  private chainStateMapSubject = new Subject<Record<string, _ChainState>>();
  private assetRegistrySubject = new Subject<Record<string, _ChainAsset>>();
  private multiChainAssetMapSubject = new Subject<Record<string, _MultiChainAsset>>();

  private logger: Logger;

  constructor (dbService: DatabaseService) {
    this.dbService = dbService;

    this.substrateChainHandler = new SubstrateChainHandler();
    this.evmChainHandler = new EvmChainHandler();

    this.chainInfoMapSubject.next(this.dataMap.chainInfoMap);
    this.chainStateMapSubject.next(this.dataMap.chainStateMap);
    this.assetRegistrySubject.next(this.dataMap.assetRegistry);
    this.multiChainAssetMapSubject.next(MultiChainAssetMap);

    this.logger = createLogger('chain-service');
  }

  // Getter
  public getEvmApi (slug: string) {
    return this.evmChainHandler.getEvmApiByChain(slug);
  }

  public getEvmApiMap () {
    return this.evmChainHandler.getEvmApiMap();
  }

  public getSubstrateApiMap () {
    return this.substrateChainHandler.getSubstrateApiMap();
  }

  public getSubstrateApi (slug: string) {
    return this.substrateChainHandler.getSubstrateApiByChain(slug);
  }

  public getChainCurrentProviderByKey (slug: string) {
    const providerName = this.getChainStateByKey(slug).currentProvider;
    const providerMap = this.getChainInfoByKey(slug).providers;
    const endpoint = providerMap[providerName];

    return {
      endpoint,
      providerName
    };
  }

  public subscribeChainInfoMap () {
    return this.chainInfoMapSubject;
  }

  public subscribeAssetRegistry () {
    return this.assetRegistrySubject;
  }

  public subscribeMultiChainAssetMap () {
    return this.multiChainAssetMapSubject;
  }

  public subscribeChainStateMap () {
    return this.chainStateMapSubject;
  }

  public getAssetRegistry () {
    return this.dataMap.assetRegistry;
  }

  public getMultiChainAssetMap () {
    return MultiChainAssetMap;
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

  public getEvmChainInfoMap (): Record<string, _ChainInfo> {
    const result: Record<string, _ChainInfo> = {};

    Object.values(this.getChainInfoMap()).forEach((chainInfo) => {
      if (_isPureEvmChain(chainInfo)) {
        result[chainInfo.slug] = chainInfo;
      }
    });

    return result;
  }

  public getSubstrateChainInfoMap (): Record<string, _ChainInfo> {
    const result: Record<string, _ChainInfo> = {};

    Object.values(this.getChainInfoMap()).forEach((chainInfo) => {
      if (_isPureSubstrateChain(chainInfo)) {
        result[chainInfo.slug] = chainInfo;
      }
    });

    return result;
  }

  public getAllPriceIds () {
    const result: string[] = [];

    Object.values(this.getAssetRegistry()).forEach((assetInfo) => {
      if (assetInfo.priceId !== null) {
        result.push(assetInfo.priceId);
      }
    });

    return result;
  }

  public getNativeTokenInfo (chainSlug: string) {
    let nativeTokenInfo: _ChainAsset = {
      assetType: _AssetType.NATIVE,
      decimals: 0,
      metadata: null,
      minAmount: '',
      multiChainAsset: '',
      name: '',
      originChain: '',
      priceId: '',
      slug: '',
      symbol: '',
      hasValue: true
    };

    for (const assetInfo of Object.values(this.getAssetRegistry())) {
      if (assetInfo.assetType === _AssetType.NATIVE && assetInfo.originChain === chainSlug) {
        nativeTokenInfo = assetInfo;
        break;
      }
    }

    return nativeTokenInfo;
  }

  public getAssetRefMap () {
    return this.dataMap.assetRefMap;
  }

  public getChainStateMap () {
    return this.dataMap.chainStateMap;
  }

  public getChainStateByKey (key: string) {
    return this.dataMap.chainStateMap[key];
  }

  public getSupportedSmartContractTypes () {
    return [_AssetType.ERC20, _AssetType.ERC721, _AssetType.PSP22, _AssetType.PSP34];
  }

  public getActiveChainInfoMap () {
    const result: Record<string, _ChainInfo> = {};

    Object.values(this.getChainInfoMap()).forEach((chainInfo) => {
      const chainState = this.getChainStateByKey(chainInfo.slug);

      if (_isChainEnabled(chainState)) {
        result[chainInfo.slug] = chainInfo;
      }
    });

    return result;
  }

  public getActiveChainSlugs () {
    const result: string[] = [];

    Object.values(this.getChainInfoMap()).forEach((chainInfo) => {
      const chainState = this.getChainStateByKey(chainInfo.slug);

      if (_isChainEnabled(chainState)) {
        result.push(chainInfo.slug);
      }
    });

    return result;
  }

  public getChainInfoByKey (key: string): _ChainInfo {
    return this.dataMap.chainInfoMap[key];
  }

  public getActiveChainInfos () {
    const result: Record<string, _ChainInfo> = {};

    Object.values(this.getChainStateMap()).forEach((chainState) => {
      if (chainState.active) {
        result[chainState.slug] = this.getChainInfoByKey(chainState.slug);
      }
    });

    return result;
  }

  public getAssetBySlug (slug: string): _ChainAsset {
    return this.getAssetRegistry()[slug];
  }

  public getFungibleTokensByChain (chainSlug: string): Record<string, _ChainAsset> {
    const result: Record<string, _ChainAsset> = {};

    Object.values(this.getAssetRegistry()).forEach((chainAsset) => {
      if (chainAsset.originChain === chainSlug && _isAssetFungibleToken(chainAsset)) {
        result[chainAsset.slug] = chainAsset;
      }
    });

    return result;
  }

  public getXcmEqualAssetByChain (destinationChainSlug: string, originTokenSlug: string) {
    let destinationTokenInfo: _ChainAsset | undefined;

    for (const asset of Object.values(this.getAssetRegistry())) {
      if (asset.originChain === destinationChainSlug) { // check
        const assetRefKey = _parseAssetRefKey(originTokenSlug, asset.slug);
        const assetRef = this.getAssetRefMap()[assetRefKey];

        if (assetRef && assetRef.path === _AssetRefPath.XCM) { // there's only 1 corresponding token on 1 chain
          destinationTokenInfo = asset;
          break;
        }
      }
    }

    return destinationTokenInfo;
  }

  public getAssetByChainAndType (chainSlug: string, assetTypes: _AssetType[]) {
    const result: Record<string, _ChainAsset> = {};

    Object.values(this.getAssetRegistry()).forEach((assetInfo) => {
      if (assetTypes.includes(assetInfo.assetType) && assetInfo.originChain === chainSlug) {
        result[assetInfo.slug] = assetInfo;
      }
    });

    return result;
  }

  public getSmartContractNfts () {
    const result: _ChainAsset[] = [];

    Object.values(this.getAssetRegistry()).forEach((assetInfo) => {
      if (_NFT_CONTRACT_STANDARDS.includes(assetInfo.assetType)) {
        result.push(assetInfo);
      }
    });

    return result;
  }

  // Setter
  public removeCustomChain (slug: string) {
    if (this.lockChainInfoMap) {
      return false;
    }

    this.lockChainInfoMap = true;

    const chainInfoMap = this.getChainInfoMap();
    const chainStateMap = this.getChainStateMap();

    if (!(slug in chainInfoMap)) {
      return false;
    }

    if (!_isCustomChain(slug)) {
      return false;
    }

    if (chainStateMap[slug].active) {
      return false;
    }

    delete chainStateMap[slug];
    delete chainInfoMap[slug];
    this.deleteAssetsByChain(slug);

    this.updateChainSubscription();

    this.dbService.removeFromChainStore([slug]).catch((e) => this.logger.error(e));

    this.lockChainInfoMap = false;

    return true;
  }

  public resetChainInfoMap (excludedChains?: string[]) {
    if (this.lockChainInfoMap) {
      return false;
    }

    this.lockChainInfoMap = true;

    const chainStateMap = this.getChainStateMap();

    for (const [slug, chainState] of Object.entries(chainStateMap)) {
      if (!_DEFAULT_ACTIVE_CHAINS.includes(slug) && !excludedChains?.includes(slug)) {
        chainState.active = false;
      }
    }

    this.updateChainStateMapSubscription();

    this.lockChainInfoMap = false;

    return true;
  }

  public setChainConnectionStatus (slug: string, connectionStatus: _ChainConnectionStatus) {
    const chainStateMap = this.getChainStateMap();

    chainStateMap[slug].connectionStatus = connectionStatus;
  }

  public upsertCustomToken (token: _ChainAsset) {
    if (token.slug.length === 0) { // new token
      if (token.assetType === _AssetType.NATIVE) {
        const defaultSlug = this.generateSlugForNativeToken(token.originChain, token.assetType, token.symbol);

        token.slug = `${_CUSTOM_PREFIX}${defaultSlug}`;
      } else {
        const defaultSlug = this.generateSlugForSmartContractAsset(token.originChain, token.assetType, token.symbol, token.metadata?.contractAddress as string);

        token.slug = `${_CUSTOM_PREFIX}${defaultSlug}`;
      }
    }

    const assetRegistry = this.getAssetRegistry();

    assetRegistry[token.slug] = token;

    this.dbService.updateAssetStore(token).catch((e) => this.logger.error(e));

    this.assetRegistrySubject.next(assetRegistry);

    return token.slug;
  }

  public deleteAssetsByChain (chainSlug: string) {
    if (!_isCustomChain(chainSlug)) {
      return;
    }

    const targetAssets: string[] = [];
    const assetRegistry = this.getAssetRegistry();

    Object.values(assetRegistry).forEach((targetToken) => {
      if (targetToken.originChain === chainSlug) {
        targetAssets.push(targetToken.slug);
      }
    });

    this.deleteCustomAssets(targetAssets);
  }

  public deleteCustomAssets (targetAssets: string[]) {
    const assetRegistry = this.getAssetRegistry();

    targetAssets.forEach((targetToken) => {
      delete assetRegistry[targetToken];
    });

    this.dbService.removeFromAssetStore(targetAssets).catch((e) => this.logger.error(e));

    this.assetRegistrySubject.next(assetRegistry);
  }

  // Business logic
  public init (callback?: () => void) { // TODO: reconsider the flow of initiation
    this.dataMap.assetRefMap = AssetRefMap;
    this.initChains().then(() => {
      this.chainInfoMapSubject.next(this.getChainInfoMap());
      this.chainStateMapSubject.next(this.getChainStateMap());
      this.assetRegistrySubject.next(this.getAssetRegistry());

      this.initApis();

      this.logger.log('Initiated chains, assets and APIs');

      if (callback) {
        callback();
      }
    }).catch((e) => this.logger.error(e));
  }

  private initApis () { // TODO: this might be async
    Object.entries(this.getChainInfoMap()).forEach(([slug, chainInfo]) => {
      if (this.getChainStateByKey(slug).active) {
        this.initApiForChain(chainInfo);
      }
    });
  }

  private initApiForChain (chainInfo: _ChainInfo) {
    const { endpoint, providerName } = this.getChainCurrentProviderByKey(chainInfo.slug);

    if (chainInfo.substrateInfo !== null) {
      const chainApi = this.initApi(chainInfo.slug, endpoint, 'substrate', providerName);

      this.substrateChainHandler.setSubstrateApi(chainInfo.slug, chainApi as _SubstrateApi);
    }

    if (chainInfo.evmInfo !== null) {
      const chainApi = this.initApi(chainInfo.slug, endpoint, 'evm', providerName);

      this.evmChainHandler.setEvmApi(chainInfo.slug, chainApi as _EvmApi);
    }
  }

  private destroyApiForChain (chainInfo: _ChainInfo) {
    if (chainInfo.substrateInfo !== null) {
      this.substrateChainHandler.destroySubstrateApi(chainInfo.slug);
    }

    if (chainInfo.evmInfo !== null) {
      this.evmChainHandler.destroyEvmApi(chainInfo.slug);
    }
  }

  private initApi (slug: string, endpoint: string, type = 'substrate', providerName?: string): _ChainBaseApi {
    switch (type) {
      case 'evm':
        return this.evmChainHandler.initApi(slug, endpoint, providerName);
      default: // substrate by default
        return this.substrateChainHandler.initApi(slug, endpoint, providerName);
    }
  }

  public enableChain (chainSlug: string): boolean {
    const chainInfo = this.getChainInfoByKey(chainSlug);
    const chainStateMap = this.getChainStateMap();

    if (chainStateMap[chainSlug].active || this.lockChainInfoMap) {
      return false;
    }

    this.lockChainInfoMap = true;
    chainStateMap[chainSlug].active = true;
    this.initApiForChain(chainInfo);

    this.dbService.updateChainStore({
      ...chainInfo,
      active: true,
      currentProvider: chainStateMap[chainSlug].currentProvider
    }).catch(console.error);

    this.updateChainStateMapSubscription();
    this.lockChainInfoMap = false;

    return true;
  }

  public disableChain (chainSlug: string): boolean {
    const chainInfo = this.getChainInfoByKey(chainSlug);
    const chainStateMap = this.getChainStateMap();

    if (!chainStateMap[chainSlug].active || this.lockChainInfoMap) {
      return false;
    }

    this.lockChainInfoMap = true;
    chainStateMap[chainSlug].active = false;
    this.destroyApiForChain(chainInfo);

    this.dbService.updateChainStore({
      ...chainInfo,
      active: false,
      currentProvider: chainStateMap[chainSlug].currentProvider
    }).catch(console.error);

    this.updateChainStateMapSubscription();
    this.lockChainInfoMap = false;

    return true;
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

  private async initChains () {
    const storedChainSettings = await this.dbService.getAllChainStore();

    const storedChainSettingMap: Record<string, IChain> = {};

    storedChainSettings.forEach((chainStoredSetting) => {
      storedChainSettingMap[chainStoredSetting.slug] = chainStoredSetting;
    });

    const newStorageData: IChain[] = [];
    const deprecatedChains: string[] = [];
    const deprecatedChainMap: Record<string, string> = {};

    if (storedChainSettings.length === 0) {
      this.dataMap.chainInfoMap = ChainInfoMap;
      Object.values(ChainInfoMap).forEach((chainInfo) => {
        this.dataMap.chainStateMap[chainInfo.slug] = {
          currentProvider: Object.keys(chainInfo.providers)[0],
          slug: chainInfo.slug,
          connectionStatus: _ChainConnectionStatus.DISCONNECTED,
          active: _DEFAULT_ACTIVE_CHAINS.includes(chainInfo.slug)
        };

        // create data for storage
        newStorageData.push({
          ...chainInfo,
          active: _DEFAULT_ACTIVE_CHAINS.includes(chainInfo.slug),
          currentProvider: Object.keys(chainInfo.providers)[0]
        });
      });
    } else {
      const mergedChainInfoMap: Record<string, _ChainInfo> = ChainInfoMap;

      for (const [storedSlug, storedChainInfo] of Object.entries(storedChainSettingMap)) {
        if (storedSlug in ChainInfoMap) { // check predefined chains first, update providers and currentProvider
          mergedChainInfoMap[storedSlug].providers = { ...storedChainInfo.providers, ...mergedChainInfoMap[storedSlug].providers };
          this.dataMap.chainStateMap[storedSlug] = {
            currentProvider: storedChainInfo.currentProvider,
            slug: storedSlug,
            connectionStatus: _ChainConnectionStatus.DISCONNECTED,
            active: storedChainInfo.active
          };

          newStorageData.push({
            ...mergedChainInfoMap[storedSlug],
            active: storedChainInfo.active,
            currentProvider: storedChainInfo.currentProvider
          });
        } else { // only custom chains are left
          // check custom chain duplicated with predefined chain => merge into predefined chain
          const duplicatedDefaultSlug = this.checkExistedPredefinedChain(storedChainInfo.substrateInfo?.genesisHash, storedChainInfo.evmInfo?.evmChainId);

          if (duplicatedDefaultSlug.length > 0) { // merge custom chain with existed chain
            mergedChainInfoMap[duplicatedDefaultSlug].providers = { ...storedChainInfo.providers, ...mergedChainInfoMap[duplicatedDefaultSlug].providers };
            this.dataMap.chainStateMap[duplicatedDefaultSlug] = {
              currentProvider: storedChainInfo.currentProvider,
              slug: duplicatedDefaultSlug,
              connectionStatus: _ChainConnectionStatus.DISCONNECTED,
              active: storedChainInfo.active
            };

            newStorageData.push({
              ...mergedChainInfoMap[duplicatedDefaultSlug],
              active: storedChainInfo.active,
              currentProvider: storedChainInfo.currentProvider
            });

            deprecatedChainMap[storedSlug] = duplicatedDefaultSlug;

            deprecatedChains.push(storedSlug);
          } else {
            mergedChainInfoMap[storedSlug] = {
              slug: storedSlug,
              name: storedChainInfo.name,
              providers: storedChainInfo.providers,
              evmInfo: storedChainInfo.evmInfo,
              substrateInfo: storedChainInfo.substrateInfo,
              isTestnet: storedChainInfo.isTestnet,
              chainStatus: storedChainInfo.chainStatus
            };
            this.dataMap.chainStateMap[storedSlug] = {
              currentProvider: storedChainInfo.currentProvider,
              slug: storedSlug,
              connectionStatus: _ChainConnectionStatus.DISCONNECTED,
              active: storedChainInfo.active
            };

            newStorageData.push({
              ...mergedChainInfoMap[storedSlug],
              active: storedChainInfo.active,
              currentProvider: storedChainInfo.currentProvider
            });
          }
        }
      }

      // Fill in the missing chainState and storageData (new chains never before seen)
      Object.entries(mergedChainInfoMap).forEach(([slug, chainInfo]) => {
        if (!(slug in this.dataMap.chainStateMap)) {
          this.dataMap.chainStateMap[slug] = {
            currentProvider: Object.keys(chainInfo.providers)[0],
            slug,
            connectionStatus: _ChainConnectionStatus.DISCONNECTED,
            active: _DEFAULT_ACTIVE_CHAINS.includes(slug)
          };

          newStorageData.push({
            ...mergedChainInfoMap[slug],
            active: _DEFAULT_ACTIVE_CHAINS.includes(slug),
            currentProvider: Object.keys(chainInfo.providers)[0]
          });
        }
      });

      this.dataMap.chainInfoMap = mergedChainInfoMap;
    }

    await this.dbService.bulkUpdateChainStore(newStorageData);
    await this.dbService.removeFromChainStore(deprecatedChains); // remove outdated records
    await this.initAssetRegistry(deprecatedChainMap);
  }

  private async initAssetRegistry (deprecatedCustomChainMap: Record<string, string>) {
    const storedAssetRegistry = await this.dbService.getAllAssetStore();

    if (storedAssetRegistry.length === 0) {
      this.dataMap.assetRegistry = ChainAssetMap;
    } else {
      const mergedAssetRegistry: Record<string, _ChainAsset> = ChainAssetMap;

      const parsedStoredAssetRegistry: Record<string, _ChainAsset> = {};
      const deprecatedAssets: string[] = [];

      // Update custom assets of merged custom chains
      Object.values(storedAssetRegistry).forEach((storedAsset) => {
        if (_isCustomAsset(storedAsset.slug) && Object.keys(deprecatedCustomChainMap).includes(storedAsset.originChain)) {
          const newOriginChain = deprecatedCustomChainMap[storedAsset.originChain];
          const newSlug = this.generateSlugForSmartContractAsset(newOriginChain, storedAsset.assetType, storedAsset.symbol, storedAsset.metadata?.contractAddress as string);

          deprecatedAssets.push(storedAsset.slug);
          parsedStoredAssetRegistry[newSlug] = {
            ...storedAsset,
            originChain: newOriginChain,
            slug: newSlug
          };
        } else {
          parsedStoredAssetRegistry[storedAsset.slug] = storedAsset;
        }
      });

      for (const assetInfo of Object.values(parsedStoredAssetRegistry)) {
        let duplicated = false;

        for (const defaultChainAsset of Object.values(ChainAssetMap)) {
          // case merge custom asset with default asset
          if (_isEqualSmartContractAsset(assetInfo, defaultChainAsset)) {
            duplicated = true;
            break;
          }
        }

        if (!duplicated) {
          mergedAssetRegistry[assetInfo.slug] = assetInfo;
        }
      }

      this.dataMap.assetRegistry = mergedAssetRegistry;

      await this.dbService.removeFromAssetStore(deprecatedAssets);
    }
  }

  private updateChainStateMapSubscription () {
    this.chainStateMapSubject.next(this.getChainStateMap());
  }

  private updateChainInfoMapSubscription () {
    this.chainInfoMapSubject.next(this.getChainInfoMap());
  }

  private updateChainSubscription () {
    this.updateChainInfoMapSubscription();
    this.updateChainStateMapSubscription();
  }

  // Can only update providers or block explorer, crowdloan url
  private updateChain (params: _NetworkUpsertParams) {
    const chainSlug = params.chainEditInfo.slug;
    const targetChainInfo = this.getChainInfoByKey(chainSlug);
    const targetChainState = this.getChainStateByKey(chainSlug);
    const changedProvider = params.chainEditInfo.currentProvider !== targetChainState.currentProvider;

    if (changedProvider) {
      targetChainInfo.providers = params.chainEditInfo.providers;
      targetChainState.currentProvider = params.chainEditInfo.currentProvider;

      // Enable chain if not before
      if (!targetChainState.active) {
        targetChainState.active = true;
      }

      // TODO: it might override existed API
      this.initApiForChain(targetChainInfo);
      this.updateChainStateMapSubscription();
    }

    if (targetChainInfo.substrateInfo) {
      if (params.chainEditInfo.blockExplorer !== undefined) {
        targetChainInfo.substrateInfo.blockExplorer = params.chainEditInfo.blockExplorer;
      }

      if (params.chainEditInfo.crowdloanUrl !== undefined) {
        targetChainInfo.substrateInfo.crowdloanUrl = params.chainEditInfo.crowdloanUrl;
      }
    }

    this.updateChainInfoMapSubscription();

    this.dbService.updateChainStore({
      ...targetChainInfo,
      active: targetChainState.active,
      currentProvider: targetChainState.currentProvider
    }).catch((e) => this.logger.error(e));
  }

  private insertChain (params: _NetworkUpsertParams) {
    const chainInfoMap = this.getChainInfoMap();

    if (!params.chainSpec) {
      return;
    }

    const newChainSlug = this.generateSlugForCustomChain(params.chainEditInfo.chainType as string, params.chainEditInfo.name as string, params.chainSpec.paraId, params.chainSpec.evmChainId);

    let substrateInfo: _SubstrateInfo | null = null;
    let evmInfo: _EvmInfo | null = null;

    if (params.chainSpec.genesisHash !== '') {
      substrateInfo = {
        addressPrefix: params.chainSpec.addressPrefix,
        blockExplorer: params.chainEditInfo.blockExplorer || null,
        chainType: params.chainSpec.paraId !== null ? _SubstrateChainType.PARACHAIN : _SubstrateChainType.RELAYCHAIN,
        crowdloanUrl: params.chainEditInfo.crowdloanUrl || null,
        decimals: params.chainSpec.decimals,
        existentialDeposit: params.chainSpec.existentialDeposit,
        paraId: params.chainSpec.paraId,
        symbol: params.chainEditInfo.symbol as string,
        genesisHash: params.chainSpec.genesisHash,
        relaySlug: null,
        hasNativeNft: false,
        supportStaking: params.chainSpec.paraId === null,
        supportSmartContract: null
      };
    } else if (params.chainSpec.evmChainId !== null) {
      evmInfo = {
        supportSmartContract: [_AssetType.ERC20, _AssetType.ERC721], // set support for ERC token by default
        blockExplorer: params.chainEditInfo.blockExplorer || null,
        decimals: params.chainSpec.decimals,
        evmChainId: params.chainSpec.evmChainId,
        existentialDeposit: params.chainSpec.existentialDeposit,
        symbol: params.chainEditInfo.symbol as string,
        abiExplorer: null
      };
    }

    const chainInfo: _ChainInfo = {
      slug: newChainSlug,
      name: params.chainEditInfo.name as string,
      providers: params.chainEditInfo.providers,
      substrateInfo,
      evmInfo,
      isTestnet: false,
      chainStatus: _ChainStatus.ACTIVE
    };

    // insert new chainInfo
    chainInfoMap[newChainSlug] = chainInfo;

    // insert new chainState
    const chainStateMap = this.getChainStateMap();

    chainStateMap[newChainSlug] = {
      active: true,
      connectionStatus: _ChainConnectionStatus.DISCONNECTED,
      currentProvider: params.chainEditInfo.currentProvider,
      slug: newChainSlug
    };
    this.initApiForChain(chainInfo);

    // create a record in assetRegistry for native token and update store/subscription
    const nativeTokenSlug = this.upsertCustomToken({
      assetType: _AssetType.NATIVE,
      decimals: params.chainSpec.decimals,
      metadata: null,
      minAmount: params.chainSpec.existentialDeposit,
      multiChainAsset: null,
      name: params.chainEditInfo.name as string,
      originChain: newChainSlug,
      priceId: null,
      slug: '',
      symbol: params.chainEditInfo.symbol as string,
      hasValue: true
    });

    // update subscription
    this.updateChainSubscription();

    // TODO: add try, catch, move storage update and subject update to somewhere else
    this.dbService.updateChainStore({
      active: true,
      currentProvider: params.chainEditInfo.currentProvider,
      ...chainInfo
    }).catch((e) => this.logger.error(e));

    return nativeTokenSlug;
  }

  public upsertChain (params: _NetworkUpsertParams) {
    if (this.lockChainInfoMap) {
      return;
    }

    this.lockChainInfoMap = true;

    let result;

    if (params.mode === 'update') { // update existing chainInfo
      this.updateChain(params);
    } else { // insert custom network
      result = this.insertChain(params);
    }

    this.lockChainInfoMap = false;

    return result;
  }

  private generateSlugForCustomChain (chainType: string, name: string, paraId: number | null, evmChainId: number | null) {
    const parsedName = name.replaceAll(' ', '').toLowerCase();

    if (evmChainId !== null && evmChainId !== undefined) {
      return `${_CUSTOM_PREFIX}${chainType}-${parsedName}-${evmChainId}`;
    } else {
      let slug = `${_CUSTOM_PREFIX}${chainType}-${parsedName}`;

      if (paraId !== null && paraId !== undefined) {
        slug = slug.concat(`-${paraId}`);
      }

      return slug;
    }
  }

  public async validateCustomChain (provider: string, existingChainSlug?: string): Promise<ValidateNetworkResponse> {
    // currently only supports WS provider for Substrate and HTTP provider for EVM
    let result: ValidateNetworkResponse = {
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

    // TODO: cant validate EVM chain

    try {
      const { conflictChainName: providerConflictChainName, conflictChainSlug: providerConflictChainSlug, error: providerError } = this.validateProvider(provider, existingChainSlug);

      if (providerError === _CHAIN_VALIDATION_ERROR.NONE) {
        let api: _EvmApi | _SubstrateApi;

        // TODO: EVM chain might have WS provider
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
          let _api = connectionTrial as _SubstrateApi | _EvmApi | null;

          const chainSpec = await this.getChainSpecByProvider(_api as _SubstrateApi | _EvmApi);

          result = Object.assign(result, chainSpec);

          // TODO: disconnect and destroy API
          // @ts-ignore
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          // _api?.api?.disconnect && await _api?.api?.disconnect();
          _api = null;

          if (existingChainSlug) {
            // check if same network (with existingChainSlug)
            const existedChainInfo = this.getChainInfoByKey(existingChainSlug);

            if (existedChainInfo.evmInfo !== null) {
              if (result.evmChainId !== existedChainInfo.evmInfo.evmChainId) {
                result.error = _CHAIN_VALIDATION_ERROR.PROVIDER_NOT_SAME_CHAIN;
              }
            } else if (existedChainInfo.substrateInfo !== null) {
              if (result.genesisHash !== existedChainInfo.substrateInfo.genesisHash) {
                result.error = _CHAIN_VALIDATION_ERROR.PROVIDER_NOT_SAME_CHAIN;
              }
            }
          } else {
            // check if network existed
            if (result.evmChainId !== null) {
              for (const chainInfo of Object.values(this.getEvmChainInfoMap())) {
                if (chainInfo?.evmInfo?.evmChainId === result.evmChainId) {
                  result.error = _CHAIN_VALIDATION_ERROR.EXISTED_CHAIN;
                  result.conflictChain = chainInfo.name;
                  result.conflictKey = chainInfo.slug;

                  break;
                }
              }
            } else if (result.genesisHash !== '') {
              for (const chainInfo of Object.values(this.getSubstrateChainInfoMap())) {
                if (chainInfo?.substrateInfo?.genesisHash === result.genesisHash) {
                  result.error = _CHAIN_VALIDATION_ERROR.EXISTED_CHAIN;
                  result.conflictChain = chainInfo.name;
                  result.conflictKey = chainInfo.slug;

                  break;
                }
              }
            }
          }
        } else {
          result.error = _CHAIN_VALIDATION_ERROR.CONNECTION_FAILURE;
          result.success = false;
        }
      } else {
        result.success = false;
        result.error = providerError;
        result.conflictChain = providerConflictChainName;
        result.conflictKey = providerConflictChainSlug;
      }

      if (!result.error && (result.evmChainId !== null || result.genesisHash !== '')) {
        result.success = true;
      }

      return result;
    } catch (e) {
      console.error('Error connecting to provider', e);

      result.success = false;
      result.error = _CHAIN_VALIDATION_ERROR.CONNECTION_FAILURE;

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
        error = _CHAIN_VALIDATION_ERROR.EXISTED_PROVIDER;
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
        error = _CHAIN_VALIDATION_ERROR.EXISTED_PROVIDER;
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

  public async validateCustomToken (data: _ValidateCustomAssetRequest): Promise<_ValidateCustomAssetResponse> {
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

  private generateSlugForSmartContractAsset (originChain: string, assetType: _AssetType, symbol: string, contractAddress: string) {
    return `${originChain}-${assetType}-${symbol}-${contractAddress}`;
  }

  private generateSlugForNativeToken (originChain: string, assetType: _AssetType, symbol: string) {
    return `${originChain}-${assetType}-${symbol}`;
  }

  public refreshSubstrateApi (slug: string) {
    this.substrateChainHandler.refreshApi(slug);
  }

  public refreshEvmApi (slug: string) {
    const { endpoint, providerName } = this.getChainCurrentProviderByKey(slug);

    this.evmChainHandler.refreshApi(slug, endpoint, providerName);
  }

  public stopAllChainApis () {
    // TODO: add logic for EvmApi
    // Object.entries(this.apiMap.web3).forEach(([key, network]) => {
    //   if (network.currentProvider instanceof Web3.providers.WebsocketProvider) {
    //     if (network.currentProvider?.connected) {
    //       console.log(`[Web3] ${key} is connected`);
    //       network.currentProvider?.disconnect(code, reason);
    //       console.log(`[Web3] ${key} is ${network.currentProvider.connected ? 'connected' : 'disconnected'} now`);
    //     }
    //   }
    // });

    return this.substrateChainHandler.disconnectAllApis();
  }

  public resumeAllChainApis () {
    // TODO: add logic for EvmApi
    // Object.entries(this.apiMap.web3).forEach(([key, network]) => {
    //   const currentProvider = network.currentProvider;

    //   if (currentProvider instanceof Web3.providers.WebsocketProvider) {
    //     if (!currentProvider.connected) {
    //       console.log(`[Web3] ${key} is disconnected`);
    //       currentProvider?.connect();
    //       setTimeout(() => console.log(`[Web3] ${key} is ${currentProvider.connected ? 'connected' : 'disconnected'} now`), 500);
    //     }
    //   }
    // });

    return this.substrateChainHandler.resumeAllApis();
  }
}
