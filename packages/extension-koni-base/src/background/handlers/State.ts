// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainInfoMap } from '@subwallet/chain-list';
import { _AssetType, _ChainAsset, _ChainInfo, _MultiChainAsset } from '@subwallet/chain-list/types';
import { EvmProviderError } from '@subwallet/extension-base/background/errors/EvmProviderError';
import { withErrorLog } from '@subwallet/extension-base/background/handlers/helpers';
import { isSubscriptionRunning, unsubscribe } from '@subwallet/extension-base/background/handlers/subscriptions';
import { AccountRefMap, AddNetworkRequestExternal, AddTokenRequestExternal, APIItemState, ApiMap, AssetSetting, AuthRequestV2, BalanceItem, BalanceJson, BasicTxErrorType, BrowserConfirmationType, ChainStakingMetadata, ChainType, ConfirmationDefinitions, ConfirmationsQueue, ConfirmationType, CrowdloanItem, CrowdloanJson, CurrentAccountInfo, EvmProviderErrorType, EvmSendTransactionParams, EvmSignatureRequestExternal, ExternalRequestPromise, ExternalRequestPromiseStatus, ExtrinsicType, KeyringState, NftCollection, NftItem, NftJson, NftTransferExtra, PriceJson, RequestAccountExportPrivateKey, RequestCheckPublicAndSecretKey, RequestConfirmationComplete, RequestSettingsType, ResponseAccountExportPrivateKey, ResponseCheckPublicAndSecretKey, ServiceInfo, SingleModeJson, StakeUnlockingJson, StakingItem, StakingJson, StakingRewardItem, StakingRewardJson, ThemeNames, UiSettings } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson, RequestAuthorizeTab, RequestRpcSend, RequestRpcSubscribe, RequestRpcUnsubscribe, RequestSign, ResponseRpcListProviders, ResponseSigning } from '@subwallet/extension-base/background/types';
import { ALL_ACCOUNT_KEY, ALL_GENESIS_HASH } from '@subwallet/extension-base/constants';
import { ChainService } from '@subwallet/extension-base/services/chain-service';
import { _PREDEFINED_SINGLE_MODES } from '@subwallet/extension-base/services/chain-service/constants';
import { _ChainConnectionStatus, _ChainState, _NetworkUpsertParams, _ValidateCustomAssetRequest } from '@subwallet/extension-base/services/chain-service/types';
import { _getEvmChainId, _getSubstrateGenesisHash, _isAssetFungibleToken, _isChainEnabled, _isSubstrateParachain } from '@subwallet/extension-base/services/chain-service/utils';
import { HistoryService } from '@subwallet/extension-base/services/history-service';
import RequestService from '@subwallet/extension-base/services/request-service';
import { AuthUrls, MetaRequest, SignRequest } from '@subwallet/extension-base/services/request-service/types';
import SettingService from '@subwallet/extension-base/services/setting-service/SettingService';
import DatabaseService from '@subwallet/extension-base/services/storage-service/DatabaseService';
import TransactionService from '@subwallet/extension-base/services/transaction-service';
import { TransactionEventResponse } from '@subwallet/extension-base/services/transaction-service/types';
import { CurrentAccountStore, PriceStore } from '@subwallet/extension-base/stores';
import AccountRefStore from '@subwallet/extension-base/stores/AccountRef';
import AssetSettingStore from '@subwallet/extension-base/stores/AssetSetting';
import { MetadataDef, ProviderMeta } from '@subwallet/extension-inject/types';
import { getTokenPrice } from '@subwallet/extension-koni-base/api/coingecko';
import { decodePair } from '@subwallet/keyring/pair/decode';
import { KeyringPair$Meta } from '@subwallet/keyring/types';
import { keyring } from '@subwallet/ui-keyring';
import { accounts } from '@subwallet/ui-keyring/observable/accounts';
import SimpleKeyring from 'eth-simple-keyring';
import { BehaviorSubject, Subject } from 'rxjs';
import { TransactionConfig } from 'web3-core';

import { JsonRpcResponse, ProviderInterface, ProviderInterfaceCallback } from '@polkadot/rpc-provider/types';
import { assert, BN, hexStripPrefix, hexToU8a, isHex, logger as createLogger, u8aToHex } from '@polkadot/util';
import { Logger } from '@polkadot/util/types';
import { base64Decode, isEthereumAddress, keyExtractSuri } from '@polkadot/util-crypto';
import { KeypairType } from '@polkadot/util-crypto/types';

import { KoniCron } from '../cron';
import { KoniSubscription } from '../subscription';

const ETH_DERIVE_DEFAULT = '/m/44\'/60\'/0\'/0/0';

// List of providers passed into constructor. This is the list of providers
// exposed by the extension.
type Providers = Record<string, {
  meta: ProviderMeta;
  // The provider is not running at init, calling this will instantiate the
  // provider.
  start: () => ProviderInterface;
}>

const getSuri = (seed: string, type?: KeypairType): string => {
  return type === 'ethereum'
    ? `${seed}${ETH_DERIVE_DEFAULT}`
    : seed;
};

const generateDefaultCrowdloanMap = (): Record<string, CrowdloanItem> => {
  const crowdloanMap: Record<string, CrowdloanItem> = {};

  Object.entries(ChainInfoMap).forEach(([networkKey, chainInfo]) => {
    if (_isSubstrateParachain(chainInfo)) {
      crowdloanMap[networkKey] = {
        state: APIItemState.PENDING,
        contribute: '0'
      };
    }
  });

  return crowdloanMap;
};

const createValidateConfirmationResponsePayload = <CT extends ConfirmationType> (fromAddress: string): (result: ConfirmationDefinitions[CT][1]) => Error | undefined => {
  return (result: ConfirmationDefinitions[CT][1]) => {
    if (result.isApproved) {
      const pair = keyring.getPair(fromAddress);

      if (pair.isLocked) {
        keyring.unlockPair(pair.address);
      }

      if (pair.isLocked) {
        return Error('Cannot unlock pair');
      }
    }

    return undefined;
  };
};

export default class KoniState {
  private injectedProviders = new Map<chrome.runtime.Port, ProviderInterface>();
  private readonly providers: Providers;
  private readonly unsubscriptionMap: Record<string, () => void> = {};

  private assetSettingStore = new AssetSettingStore();
  private readonly priceStore = new PriceStore();
  private readonly currentAccountStore = new CurrentAccountStore();
  private readonly accountRefStore = new AccountRefStore();
  private readonly keyringStateSubject = new Subject<KeyringState>();
  private priceStoreReady = false;
  private externalRequest: Record<string, ExternalRequestPromise> = {};

  private keyringState: KeyringState = {
    isReady: false,
    isLocked: true,
    hasMasterPassword: false
  };

  private serviceInfoSubject = new Subject<ServiceInfo>();

  private balanceMap: Record<string, BalanceItem> = {};
  private balanceSubject = new Subject<BalanceJson>();

  private crowdloanMap: Record<string, CrowdloanItem> = generateDefaultCrowdloanMap();
  private crowdloanSubject = new Subject<CrowdloanJson>();

  private nftTransferSubject = new Subject<NftTransferExtra>();
  // Only for rendering nft after transfer
  private nftTransferState: NftTransferExtra = {
    cronUpdate: false,
    forceUpdate: false
  };

  private nftSubject = new Subject<NftJson>();
  private stakingSubject = new Subject<StakingJson>();
  private chainStakingMetadataSubject = new Subject<ChainStakingMetadata[]>();

  private stakingRewardSubject = new Subject<StakingRewardJson>();
  private stakingRewardState: StakingRewardJson = {
    ready: false,
    slowInterval: [],
    fastInterval: []
  } as StakingRewardJson;

  private stakeUnlockingInfoSubject = new Subject<StakeUnlockingJson>();
  private stakeUnlockingInfo: StakeUnlockingJson = { timestamp: -1, details: [] };

  private lazyMap: Record<string, unknown> = {};

  // TODO: consider making chainService public (or getter) and call function directly
  private chainService: ChainService;
  public dbService: DatabaseService;
  private cron: KoniCron;
  private subscription: KoniSubscription;
  private logger: Logger;
  private ready = false;
  private readonly settingService: SettingService;
  private readonly requestService: RequestService;

  readonly transactionService: TransactionService;
  readonly historyService: HistoryService;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor (providers: Providers = {}) {
    this.providers = providers;

    this.dbService = new DatabaseService();

    this.chainService = new ChainService(this.dbService);
    this.settingService = new SettingService();
    this.requestService = new RequestService(this.chainService);
    this.transactionService = new TransactionService(this.chainService, this.requestService);
    this.historyService = new HistoryService(this.dbService, this.chainService);
    this.subscription = new KoniSubscription(this, this.dbService);
    this.cron = new KoniCron(this, this.subscription, this.dbService);
    this.logger = createLogger('State');
    this.init();
  }

  // Clone from polkadot.js
  public get knownMetadata (): MetadataDef[] {
    return this.requestService.knownMetadata;
  }

  public injectMetadata (url: string, request: MetadataDef): Promise<boolean> {
    return this.requestService.injectMetadata(url, request);
  }

  public getMetaRequest (id: string): MetaRequest {
    return this.requestService.getMetaRequest(id);
  }

  public getSignRequest (id: string): SignRequest | undefined {
    return this.requestService.getSignRequest(id);
  }

  // List all providers the extension is exposing
  public rpcListProviders (): Promise<ResponseRpcListProviders> {
    return Promise.resolve(Object.keys(this.providers).reduce((acc, key) => {
      acc[key] = this.providers[key].meta;

      return acc;
    }, {} as ResponseRpcListProviders));
  }

  public rpcSend (request: RequestRpcSend, port: chrome.runtime.Port): Promise<JsonRpcResponse> {
    const provider = this.injectedProviders.get(port);

    assert(provider, 'Cannot call pub(rpc.subscribe) before provider is set');

    return provider.send(request.method, request.params);
  }

  // Start a provider, return its meta
  public rpcStartProvider (key: string, port: chrome.runtime.Port): Promise<ProviderMeta> {
    assert(Object.keys(this.providers).includes(key), `Provider ${key} is not exposed by extension`);

    if (this.injectedProviders.get(port)) {
      return Promise.resolve(this.providers[key].meta);
    }

    // Instantiate the provider
    this.injectedProviders.set(port, this.providers[key].start());

    // Close provider connection when page is closed
    port.onDisconnect.addListener((): void => {
      const provider = this.injectedProviders.get(port);

      if (provider) {
        withErrorLog(() => provider.disconnect());
      }

      this.injectedProviders.delete(port);
    });

    return Promise.resolve(this.providers[key].meta);
  }

  public rpcSubscribe ({ method,
    params,
    type }: RequestRpcSubscribe, cb: ProviderInterfaceCallback, port: chrome.runtime.Port): Promise<number | string> {
    const provider = this.injectedProviders.get(port);

    assert(provider, 'Cannot call pub(rpc.subscribe) before provider is set');

    return provider.subscribe(type, method, params, cb);
  }

  public rpcSubscribeConnected (_request: null, cb: ProviderInterfaceCallback, port: chrome.runtime.Port): void {
    const provider = this.injectedProviders.get(port);

    assert(provider, 'Cannot call pub(rpc.subscribeConnected) before provider is set');

    cb(null, provider.isConnected); // Immediately send back current isConnected
    provider.on('connected', () => cb(null, true));
    provider.on('disconnected', () => cb(null, false));
  }

  public rpcUnsubscribe (request: RequestRpcUnsubscribe, port: chrome.runtime.Port): Promise<boolean> {
    const provider = this.injectedProviders.get(port);

    assert(provider, 'Cannot call pub(rpc.unsubscribe) before provider is set');

    return provider.unsubscribe(request.type, request.method, request.subscriptionId);
  }

  public saveMetadata (meta: MetadataDef): void {
    this.requestService.saveMetadata(meta);
  }

  public setNotification (notification: string): boolean {
    this.requestService.setNotification(notification);

    return true;
  }

  public sign (url: string, request: RequestSign, account: AccountJson): Promise<ResponseSigning> {
    return this.requestService.sign(url, request, account);
  }

  public get authSubjectV2 () {
    return this.requestService.authSubjectV2;
  }

  public generateDefaultBalanceMap () {
    const balanceMap: Record<string, BalanceItem> = {};
    const activeChains = this.chainService.getActiveChainInfoMap();

    Object.values(activeChains).forEach((chainInfo) => {
      const chainAssetMap = this.chainService.getFungibleTokensByChain(chainInfo.slug);

      Object.keys(chainAssetMap).forEach((assetSlug) => {
        balanceMap[assetSlug] = {
          tokenSlug: assetSlug,
          free: '',
          locked: '',
          state: APIItemState.PENDING
        };
      });
    });

    return balanceMap;
  }

  private initAssetSetting () {
    this.assetSettingStore.get('AssetSetting', (storedAssetSettings) => {
      const activeChainSlugs = this.chainService.getActiveChainSlugs();
      const assetRegistry = this.chainService.getAssetRegistry();

      const assetSettings: Record<string, AssetSetting> = storedAssetSettings || {};

      Object.values(assetRegistry).forEach((assetInfo) => {
        const isSettingExisted = assetInfo.slug in assetSettings;

        // Set visible for every enabled chains
        if (activeChainSlugs.includes(assetInfo.originChain) && !isSettingExisted) {
          // Setting only exist when set either by chain settings or user
          assetSettings[assetInfo.slug] = {
            visible: true
          };
        }
      });

      this.setAssetSettings(assetSettings);
      this.logger.log('Done init asset settings');
    });
  }

  public init () {
    this.chainService.init(() => {
      this.onReady(); // TODO: do better than a callback
      this.initAssetSetting();
      this.updateServiceInfo();

      this.startSubscription();
      this.logger.log('Done init state');
    });
  }

  private startSubscription () {
    this.dbService.subscribeChainStakingMetadata([], (data) => {
      console.log('subscribing chainStakingMetadata');
      this.chainStakingMetadataSubject.next(data);
    });
  }

  public onReady () {
    this.subscription.start();
    this.cron.start();

    this.ready = true;

    this.logger.log('State is ready');
  }

  public isReady () {
    return this.ready;
  }

  public getKeyringState (): KeyringState {
    return this.keyringState;
  }

  public subscribeKeyringState (): Subject<KeyringState> {
    return this.keyringStateSubject;
  }

  public setKeyringState (data: KeyringState, callback?: () => void): void {
    this.keyringStateSubject.next(data);
    this.keyringState = data;
    callback && callback();
  }

  private lazyNext = (key: string, callback: () => void) => {
    if (this.lazyMap[key]) {
      // @ts-ignore
      clearTimeout(this.lazyMap[key]);
    }

    const lazy = setTimeout(() => {
      callback();
      clearTimeout(lazy);
    }, 300);

    this.lazyMap[key] = lazy;
  };

  public getAuthRequestV2 (id: string): AuthRequestV2 {
    return this.requestService.getAuthRequestV2(id);
  }

  public setAuthorize (data: AuthUrls, callback?: () => void): void {
    this.requestService.setAuthorize(data, callback);
  }

  public getAuthorize (update: (value: AuthUrls) => void): void {
    this.requestService.getAuthorize(update);
  }

  public subscribeEvmChainChange (): Subject<AuthUrls> {
    return this.requestService.subscribeEvmChainChange;
  }

  public subscribeAuthorizeUrlSubject (): Subject<AuthUrls> {
    return this.requestService.subscribeAuthorizeUrlSubject;
  }

  public getAuthList (): Promise<AuthUrls> {
    return this.requestService.getAuthList();
  }

  getAddressList (value = false): Record<string, boolean> {
    const addressList = Object.keys(accounts.subject.value);

    return addressList.reduce((addressList, v) => ({ ...addressList, [v]: value }), {});
  }

  public async authorizeUrlV2 (url: string, request: RequestAuthorizeTab): Promise<boolean> {
    return this.requestService.authorizeUrlV2(url, request);
  }

  public getNativeTokenInfo (networkKey: string) {
    return this.chainService.getNativeTokenInfo(networkKey);
  }

  public getChainInfo (networkKey: string) {
    return this.chainService.getChainInfoByKey(networkKey);
  }

  public async getChainStakingMetadata (): Promise<ChainStakingMetadata[]> {
    return this.dbService.getChainStakingMetadata();
  }

  public async getStaking (): Promise<StakingJson> {
    const addresses = await this.getDecodedAddresses();

    const stakings = await this.dbService.getStakings(addresses, this.activeChainSlugs);

    return { ready: true, details: stakings } as StakingJson;
  }

  public async getStakingRecordsByAddress (address: string): Promise<StakingItem[]> {
    return await this.dbService.getStakings([address], this.activeChainSlugs);
  }

  public async getPooledStakingRecordsByAddress (addresses: string[]): Promise<StakingItem[]> {
    return await this.dbService.getPooledStakings(addresses, this.activeChainSlugs);
  }

  // TODO: delete later
  // public async getStoredStaking (address: string) {
  //   const items = await this.dbService.stores.staking.getDataByAddressAsObject(address);
  //
  //   return items || {};
  // }

  public getStakeUnlockingInfo () {
    return this.stakeUnlockingInfo;
  }

  public setStakeUnlockingInfo (data: StakeUnlockingJson) {
    this.stakeUnlockingInfo = data;

    this.stakeUnlockingInfoSubject.next(this.stakeUnlockingInfo);
  }

  public subscribeStakeUnlockingInfo () {
    return this.stakeUnlockingInfoSubject;
  }

  public subscribeStaking () {
    return this.stakingSubject;
  }

  public subscribeChainStakingMetadata () {
    return this.chainStakingMetadataSubject;
  }

  public ensureUrlAuthorizedV2 (url: string): Promise<boolean> {
    return this.requestService.ensureUrlAuthorizedV2(url);
  }

  public setStakingItem (networkKey: string, item: StakingItem): void {
    this.dbService.updateStaking(networkKey, item.address, item).catch((e) => this.logger.warn(e));
  }

  public updateChainStakingMetadata (item: ChainStakingMetadata) {
    this.dbService.updateChainStakingMetadata(item).catch((e) => this.logger.warn(e));
  }

  public setNftTransfer (data: NftTransferExtra, callback?: (data: NftTransferExtra) => void): void {
    this.nftTransferState = data;

    if (callback) {
      callback(data);
    }

    this.nftTransferSubject.next(data);
  }

  public getNftTransfer (): NftTransferExtra {
    return this.nftTransferState;
  }

  public getNftTransferSubscription (update: (value: NftTransferExtra) => void): void {
    update(this.nftTransferState);
  }

  public subscribeNftTransfer () {
    return this.nftTransferSubject;
  }

  public setNftCollection (network: string, data: NftCollection, callback?: (data: NftCollection) => void): void {
    this.dbService.addNftCollection(data).catch((e) => this.logger.warn(e));
    callback && callback(data);
  }

  public getNftCollection () {
    return this.dbService.getAllNftCollection(this.activeChainSlugs);
  }

  public subscribeNftCollection () {
    return this.dbService.stores.nftCollection.subscribeNftCollection(this.activeChainSlugs);
  }

  public async resetNft (newAddress: string): Promise<void> {
    this.getNft().then((data) => this.nftSubject.next(data || {
      nftList: [],
      total: 0
    })).catch((e) => this.logger.warn(e));

    const addresses = await this.getDecodedAddresses(newAddress);

    this.dbService.subscribeNft(addresses, this.activeChainSlugs, (nfts) => {
      this.nftSubject.next({
        nftList: nfts,
        total: nfts.length
      });
    });
  }

  public updateNftData (network: string, nftData: NftItem, address: string, callback?: (nftData: NftItem) => void): void {
    this.dbService.addNft(address, nftData).catch((e) => this.logger.warn(e));

    callback && callback(nftData);
  }

  public updateNftIds (chain: string, address: string, collectionId?: string, nftIds?: string[]): void {
    this.dbService.deleteRemovedNftsFromCollection(chain, address, collectionId, nftIds).catch((e) => this.logger.warn(e));
  }

  public removeNfts (chain: string, address: string, collectionId: string, nftIds: string[]) {
    return this.dbService.removeNfts(chain, address, collectionId, nftIds);
  }

  public deleteNftCollection (chain: string, collectionId: string) {
    return this.dbService.deleteNftCollection(chain, collectionId);
  }

  public updateCollectionIds (chain: string, address: string, collectionIds: string[] = []): void {
    this.dbService.deleteNftsFromRemovedCollection(chain, address, collectionIds);
  }

  public async getNft (): Promise<NftJson | undefined> {
    const addresses = await this.getDecodedAddresses();

    if (!addresses.length) {
      return;
    }

    const nfts = await this.dbService.getNft(addresses, this.activeChainSlugs);

    return {
      nftList: nfts,
      total: nfts.length
    };
  }

  public subscribeNft () {
    return this.nftSubject;
  }

  public resetStakingReward () {
    this.stakingRewardState.slowInterval = [];

    this.stakingRewardSubject.next(this.stakingRewardState);
  }

  public updateStakingReward (stakingRewardData: StakingRewardItem[], type: 'slowInterval' | 'fastInterval', callback?: (stakingRewardData: StakingRewardJson) => void): void {
    this.stakingRewardState.ready = true;
    this.stakingRewardState[type] = stakingRewardData;

    if (callback) {
      callback(this.stakingRewardState);
    }

    this.stakingRewardSubject.next(this.stakingRewardState);
  }

  public updateStakingRewardReady (ready: boolean) {
    this.stakingRewardState.ready = ready;
    this.stakingRewardSubject.next(this.stakingRewardState);
  }

  public getAccountRefMap (callback: (refMap: Record<string, Array<string>>) => void) {
    const refMap: AccountRefMap = {};

    this.accountRefStore.get('refList', (refList) => {
      if (refList) {
        refList.forEach((accRef) => {
          accRef.forEach((acc) => {
            refMap[acc] = [...accRef].filter((r) => !(r === acc));
          });
        });
      }

      callback(refMap);
    });
  }

  public addAccountRef (addresses: string[], callback: () => void) {
    this.accountRefStore.get('refList', (refList) => {
      const newList = refList ? [...refList] : [];

      newList.push(addresses);

      this.accountRefStore.set('refList', newList, callback);
    });
  }

  public removeAccountRef (address: string, callback: () => void) {
    this.accountRefStore.get('refList', (refList) => {
      if (refList) {
        refList.forEach((accRef) => {
          if (accRef.indexOf(address) > -1) {
            accRef.splice(accRef.indexOf(address), 1);
          }

          if (accRef.length < 2) {
            refList.splice(refList.indexOf(accRef), 1);
          }
        });

        this.accountRefStore.set('refList', refList, () => {
          callback();
        });
      } else {
        callback();
      }
    });
  }

  public getStakingReward (update: (value: StakingRewardJson) => void): void {
    update(this.stakingRewardState);
  }

  public subscribeStakingReward () {
    return this.stakingRewardSubject;
  }

  public getCurrentAccount (update: (value: CurrentAccountInfo) => void): void {
    this.currentAccountStore.get('CurrentAccountInfo', update);
  }

  public setCurrentAccount (data: CurrentAccountInfo, callback?: () => void): void {
    const { address, currentGenesisHash } = data;

    const result: CurrentAccountInfo = { ...data };

    if (address === ALL_ACCOUNT_KEY) {
      const pairs = keyring.getPairs();
      const pair = pairs[0];
      const pairGenesisHash = pair.meta.genesisHash as string;

      if (pairs.length > 1 || !pair) {
        result.allGenesisHash = currentGenesisHash || undefined;
      } else {
        result.address = pair.address;
        result.currentGenesisHash = pairGenesisHash || '';
        result.allGenesisHash = pairGenesisHash || undefined;
      }
    }

    this.currentAccountStore.set('CurrentAccountInfo', result, () => {
      this.updateServiceInfo();
      callback && callback();
    });
  }

  public setAccountTie (address: string, genesisHash: string | null): boolean {
    if (address !== ALL_ACCOUNT_KEY) {
      const pair = keyring.getPair(address);

      assert(pair, 'Unable to find pair');

      keyring.saveAccountMeta(pair, { ...pair.meta, genesisHash });
    }

    this.getCurrentAccount((accountInfo) => {
      if (address === accountInfo.address) {
        accountInfo.currentGenesisHash = genesisHash as string || ALL_GENESIS_HASH;

        this.setCurrentAccount(accountInfo);
      }
    });

    return true;
  }

  public async switchEvmNetworkByUrl (shortenUrl: string, networkKey: string): Promise<void> {
    const authUrls = await this.getAuthList();
    const chainInfo = this.chainService.getChainInfoByKey(networkKey);
    const chainState = this.chainService.getChainStateByKey(networkKey);

    if (authUrls[shortenUrl]) {
      if (chainInfo && !_isChainEnabled(chainState)) {
        this.enableChain(networkKey);
      }

      authUrls[shortenUrl].currentEvmNetworkKey = networkKey;
      this.setAuthorize(authUrls);
    } else {
      throw new EvmProviderError(EvmProviderErrorType.INTERNAL_ERROR, `Not found ${shortenUrl} in auth list`);
    }
  }

  public async switchNetworkAccount (id: string, url: string, networkKey: string, changeAddress?: string): Promise<boolean> {
    const chainInfo = this.chainService.getChainInfoByKey(networkKey);
    const chainState = this.chainService.getChainStateByKey(networkKey);

    const { address, currentGenesisHash } = await new Promise<CurrentAccountInfo>((resolve) => {
      this.getCurrentAccount(resolve);
    });

    return this.requestService.addConfirmation(id, url, 'switchNetworkRequest', {
      networkKey,
      address: changeAddress
    }, { address: changeAddress })
      .then(({ isApproved }) => {
        if (isApproved) {
          const useAddress = changeAddress || address;

          if (chainInfo && !_isChainEnabled(chainState)) {
            this.enableChain(networkKey);
          }

          if (useAddress !== ALL_ACCOUNT_KEY) {
            const pair = keyring.getPair(useAddress);

            assert(pair, 'Unable to find pair');

            keyring.saveAccountMeta(pair, { ...pair.meta, genesisHash: _getSubstrateGenesisHash(chainInfo) });
          }

          if (address !== changeAddress || _getSubstrateGenesisHash(chainInfo) !== currentGenesisHash || isApproved) {
            this.setCurrentAccount({
              address: useAddress,
              currentGenesisHash: _getSubstrateGenesisHash(chainInfo)
            });
          }
        }

        return isApproved;
      });
  }

  public async addNetworkConfirm (id: string, url: string, networkData: AddNetworkRequestExternal) {
    networkData.requestId = id;

    return this.requestService.addConfirmation(id, url, 'addNetworkRequest', networkData)
      .then(({ isApproved }) => {
        return isApproved;
      });
  }

  public async addTokenConfirm (id: string, url: string, tokenInfo: AddTokenRequestExternal) {
    return this.requestService.addConfirmation(id, url, 'addTokenRequest', tokenInfo)
      .then(({ isApproved }) => {
        return isApproved;
      });
  }

  public get metaSubject () {
    return this.requestService.metaSubject;
  }

  public get signSubject () {
    return this.requestService.signSubject;
  }

  public getSettings (callback: (settings: UiSettings) => void): void {
    this.settingService.getSettings(callback);
  }

  public setSettings (settings: UiSettings, callback?: () => void): void {
    this.settingService.setSettings(settings, callback);
  }

  public setTheme (theme: ThemeNames, callback?: (settingData: UiSettings) => void): void {
    this.settingService.getSettings((settings) => {
      const newSettings = {
        ...settings,
        theme
      };

      this.settingService.setSettings(newSettings, () => {
        callback && callback(newSettings);
      });
    });
  }

  public setBrowserConfirmationType (browserConfirmationType: BrowserConfirmationType, callback?: (settingData: UiSettings) => void): void {
    this.settingService.getSettings((settings) => {
      const newSettings = {
        ...settings,
        browserConfirmationType
      };

      this.settingService.setSettings(newSettings, () => {
        callback && callback(newSettings);
      });
    });
  }

  public subscribeSettingsSubject (): Subject<RequestSettingsType> {
    return this.settingService.getSubject();
  }

  public subscribeCurrentAccount (): Subject<CurrentAccountInfo> {
    return this.currentAccountStore.getSubject();
  }

  public getAccountAddress (): Promise<string | null | undefined> {
    return new Promise((resolve, reject) => {
      this.getCurrentAccount((account) => {
        if (account) {
          resolve(account.address);
        } else {
          resolve(null);
        }
      });
    });
  }

  public async getDecodedAddresses (address?: string): Promise<string[]> {
    let checkingAddress: string | null | undefined = address;

    if (!address) {
      checkingAddress = await this.getAccountAddress();
    }

    if (!checkingAddress) {
      return [];
    }

    if (checkingAddress === ALL_ACCOUNT_KEY) {
      return Object.keys(accounts.subject.value);
    }

    return [checkingAddress];
  }

  public getAllAddresses (): string[] {
    return Object.keys(accounts.subject.value);
  }

  private removeInactiveChainBalances (balanceMap: Record<string, BalanceItem>) {
    const activeBalanceMap: Record<string, BalanceItem> = {};

    Object.entries(balanceMap).forEach(([tokenSlug, balanceItem]) => {
      const tokenInfo = this.chainService.getAssetBySlug(tokenSlug);

      if (tokenInfo) {
        const chainInfo = this.chainService.getChainInfoByKey(tokenInfo.originChain);

        if (chainInfo && this.getChainStateByKey(chainInfo.slug).active) {
          activeBalanceMap[tokenSlug] = balanceItem;
        }
      }
    });

    return activeBalanceMap;
  }

  public getBalance (reset?: boolean): BalanceJson {
    const activeData = this.removeInactiveChainBalances(this.balanceMap);

    return { details: activeData, reset } as BalanceJson;
  }

  public async getStoredBalance (address: string): Promise<Record<string, BalanceItem>> {
    const items = await this.dbService.stores.balance.getBalanceMapByAddress(address);

    return items || {};
  }

  public async switchAccount (newAddress: string) {
    await Promise.all([
      this.resetBalanceMap(newAddress),
      this.resetCrowdloanMap(newAddress)
    ]);
  }

  public async resetBalanceMap (newAddress: string) {
    const defaultData = this.generateDefaultBalanceMap();
    let storedData = await this.getStoredBalance(newAddress);

    storedData = this.removeInactiveChainBalances(storedData);

    this.balanceMap = { ...defaultData, ...storedData } as Record<string, BalanceItem>;
    this.publishBalance(true);
  }

  public async resetCrowdloanMap (newAddress: string) {
    const defaultData = generateDefaultCrowdloanMap();
    const storedData = await this.getStoredCrowdloan(newAddress);

    this.crowdloanMap = { ...defaultData, ...storedData } as Record<string, CrowdloanItem>;
    this.publishCrowdloan(true);
  }

  public async resetStaking (newAddress: string) {
    this.getStaking()
      .then((data) => {
        this.stakingSubject.next(data);
      })
      .catch((e) => this.logger.warn(e));

    const addresses = await this.getDecodedAddresses(newAddress);

    this.dbService.subscribeStaking(addresses, this.activeChainSlugs, (stakings) => {
      this.stakingSubject.next({
        ready: true,
        details: stakings
      });
    });
  }

  public setBalanceItem (tokenSlug: string, item: BalanceItem) {
    this.balanceMap[tokenSlug] = { timestamp: +new Date(), ...item };
    this.updateBalanceStore(item);

    this.lazyNext('setBalanceItem', () => {
      this.publishBalance();
    });
  }

  private updateBalanceStore (item: BalanceItem) {
    this.getCurrentAccount((currentAccountInfo) => {
      this.dbService.updateBalanceStore(currentAccountInfo.address, item).catch((e) => this.logger.warn(e));
    });
  }

  public subscribeBalance () {
    return this.balanceSubject;
  }

  public getCrowdloan (reset?: boolean): CrowdloanJson {
    return { details: this.crowdloanMap, reset } as CrowdloanJson;
  }

  public async getStoredCrowdloan (address: string) {
    const items = await this.dbService.stores.crowdloan.getDataByAddressAsObject(address);

    return items || {};
  }

  public setCrowdloanItem (networkKey: string, item: CrowdloanItem) {
    const itemData = { ...item, timestamp: +new Date() };

    // Update crowdloan map
    this.crowdloanMap[networkKey] = itemData;
    this.updateCrowdloanStore(networkKey, itemData);

    this.lazyNext('setCrowdloanItem', () => {
      this.publishCrowdloan();
    });
  }

  private updateCrowdloanStore (networkKey: string, item: CrowdloanItem) {
    this.getCurrentAccount((currentAccountInfo) => {
      this.dbService.updateCrowdloanStore(networkKey, currentAccountInfo.address, item).catch((e) => this.logger.warn(e));
    });
  }

  public subscribeCrowdloan () {
    return this.crowdloanSubject;
  }

  public getAllPriceIds () {
    return this.chainService.getAllPriceIds();
  }

  public setPrice (priceData: PriceJson, callback?: (priceData: PriceJson) => void): void {
    this.priceStore.set('PriceData', priceData, () => {
      if (callback) {
        callback(priceData);
        this.priceStoreReady = true;
      }
    });
  }

  public getPrice (update: (value: PriceJson) => void): void {
    this.priceStore.get('PriceData', (rs) => {
      if (this.priceStoreReady) {
        update(rs);
      } else {
        const allPriceIds = this.getAllPriceIds();

        getTokenPrice(allPriceIds)
          .then((rs) => {
            this.setPrice(rs);
            update(rs);
          })
          .catch((err) => {
            this.logger.error(err);
            throw err;
          });
      }
    });
  }

  public subscribePrice () {
    return this.priceStore.getSubject();
  }

  public setAssetSettings (assetSettings: Record<string, AssetSetting>): void {
    this.assetSettingStore.set('AssetSetting', assetSettings);
  }

  public getAssetSettings (update: (value: Record<string, AssetSetting>) => void) {
    this.assetSettingStore.get('AssetSetting', (rs) => {
      update(rs);
    });
  }

  public updateAssetSetting (assetSlug: string, assetSetting: AssetSetting) {
    this.assetSettingStore.get('AssetSetting', (currentAssetSettings) => {
      this.assetSettingStore.set('AssetSetting', {
        ...currentAssetSettings,
        [assetSlug]: assetSetting
      });
    });
  }

  public subscribeAssetSettings () {
    return this.assetSettingStore.getSubject();
  }

  public getSmartContractNfts () {
    return this.chainService.getSmartContractNfts();
  }

  // ChainService ------------------------------------------------

  public getChainInfoMap () {
    return this.chainService.getChainInfoMap();
  }

  public getChainStateMap () {
    return this.chainService.getChainStateMap();
  }

  public getAssetRefMap () {
    return this.chainService.getAssetRefMap();
  }

  public getChainStateByKey (key: string) {
    return this.chainService.getChainStateByKey(key);
  }

  public getAssetRegistry () {
    return this.chainService.getAssetRegistry();
  }

  public getMultiChainAssetMap () {
    return this.chainService.getMultiChainAssetMap();
  }

  public getAssetByChainAndAsset (chain: string, assetTypes: _AssetType[]) {
    return this.chainService.getAssetByChainAndType(chain, assetTypes);
  }

  public getAssetBySlug (slug: string) {
    return this.chainService.getAssetBySlug(slug);
  }

  public getXcmEqualAssetByChain (destinationChain: string, originTokenSlug: string) {
    return this.chainService.getXcmEqualAssetByChain(destinationChain, originTokenSlug);
  }

  public subscribeChainInfoMap (): Subject<Record<string, _ChainInfo>> {
    return this.chainService.subscribeChainInfoMap();
  }

  public subscribeChainStateMap (): Subject<Record<string, _ChainState>> {
    return this.chainService.subscribeChainStateMap();
  }

  public subscribeAssetRegistry (): Subject<Record<string, _ChainAsset>> {
    return this.chainService.subscribeAssetRegistry();
  }

  public subscribeMultiChainAssetMap (): Subject<Record<string, _MultiChainAsset>> {
    return this.chainService.subscribeMultiChainAssetMap();
  }

  public upsertCustomToken (data: _ChainAsset) {
    const tokenSlug = this.chainService.upsertCustomToken(data);

    if (_isAssetFungibleToken(data)) {
      this.updateAssetSetting(tokenSlug, { visible: true });
    }

    this.updateServiceInfo();
  }

  public deleteCustomAssets (targetTokens: string[]) {
    this.chainService.deleteCustomAssets(targetTokens);
    this.updateServiceInfo();
  }

  public async validateCustomChain (provider: string, existedChainSlug?: string) {
    return await this.chainService.validateCustomChain(provider, existedChainSlug);
  }

  public getSupportedSmartContractTypes () {
    return this.chainService.getSupportedSmartContractTypes();
  }

  public async validateCustomAsset (data: _ValidateCustomAssetRequest) {
    return await this.chainService.validateCustomToken(data);
  }

  // ------------------------------------------------

  public getActiveChainInfoMap () {
    return this.chainService.getActiveChainInfoMap();
  }

  public upsertChainInfo (data: _NetworkUpsertParams): boolean {
    const newNativeTokenSlug = this.chainService.upsertChain(data);

    if (newNativeTokenSlug) {
      this.updateAssetSetting(newNativeTokenSlug, { visible: true });
    }

    this.updateServiceInfo();

    return true;
  }

  public removeCustomChain (networkKey: string): boolean {
    const result = this.chainService.removeCustomChain(networkKey);

    this.updateServiceInfo();

    return result;
  }

  // TODO: avoids turning off chains related to ledger account
  private getDefaultNetworkKeys = (): string[] => {
    const genesisHashes: Record<string, string> = {};

    const pairs = keyring.getPairs();

    pairs.forEach((pair) => {
      const originGenesisHash = pair.meta.originGenesisHash;

      if (originGenesisHash && typeof originGenesisHash === 'string') {
        genesisHashes[originGenesisHash] = originGenesisHash;
      }
    });

    const hashes = Object.keys(genesisHashes);

    const result: string[] = [];

    for (const [key, network] of Object.entries(this.chainService.getChainInfoMap())) {
      const condition = hashes.includes(_getSubstrateGenesisHash(network) || '');

      if (condition) {
        result.push(key);
      }
    }

    return result;
  };

  public updateAssetSettingByChain (chainSlug: string, visible: boolean) {
    this.assetSettingStore.get('AssetSetting', (storedAssetSettings) => {
      const assetsByChain = this.chainService.getFungibleTokensByChain(chainSlug);
      const assetSettings: Record<string, AssetSetting> = storedAssetSettings || {};

      Object.values(assetsByChain).forEach((assetInfo) => {
        assetSettings[assetInfo.slug] = { visible };
      });

      this.setAssetSettings(assetSettings);
    });
  }

  public disableChain (chainSlug: string): boolean {
    // const defaultChains = this.getDefaultNetworkKeys();
    this.updateAssetSettingByChain(chainSlug, false);

    const result = this.chainService.disableChain(chainSlug);

    this.updateServiceInfo();

    return result;
  }

  public enableChain (chainSlug: string, enableTokens = true): boolean {
    if (enableTokens) {
      this.updateAssetSettingByChain(chainSlug, true);
    }

    const result = this.chainService.enableChain(chainSlug);

    this.updateServiceInfo();

    return result;
  }

  public resetDefaultChains () {
    const defaultChains = this.getDefaultNetworkKeys();

    return this.chainService.resetChainInfoMap(defaultChains);
  }

  public updateNetworkStatus (networkKey: string, status: _ChainConnectionStatus) {
    const chainState = this.chainService.getChainStateByKey(networkKey);

    if (chainState.connectionStatus === status) {
      return;
    }

    this.chainService.setChainConnectionStatus(networkKey, status);
  }

  public getSubstrateApiMap () {
    return this.chainService.getSubstrateApiMap();
  }

  public getSubstrateApi (networkKey: string) {
    return this.chainService.getSubstrateApi(networkKey);
  }

  public getEvmApiMap () {
    return this.chainService.getEvmApiMap();
  }

  public getEvmApi (networkKey: string) {
    return this.chainService.getEvmApi(networkKey);
  }

  public getApiMap () {
    return {
      substrate: this.chainService.getSubstrateApiMap(),
      evm: this.chainService.getEvmApiMap()
    } as ApiMap;
  }

  public refreshSubstrateApi (key: string) {
    this.chainService.refreshSubstrateApi(key);

    return true;
  }

  public refreshWeb3Api (key: string) {
    this.chainService.refreshEvmApi(key);
  }

  public subscribeServiceInfo () {
    return this.serviceInfoSubject;
  }

  public updateServiceInfo () {
    this.logger.log('<---Update serviceInfo--->');
    this.getCurrentAccount((value) => {
      this.serviceInfoSubject.next({
        chainInfoMap: this.chainService.getChainInfoMap(),
        chainApiMap: this.getApiMap(),
        currentAccountInfo: value,
        assetRegistry: this.chainService.getAssetRegistry(),
        chainStateMap: this.chainService.getChainStateMap()
      });
    });
  }

  public getExternalRequestMap (): Record<string, ExternalRequestPromise> {
    return this.externalRequest;
  }

  public setExternalRequestMap (id: string, value: ExternalRequestPromise) {
    this.externalRequest[id] = value;
  }

  public getExternalRequest (id: string): ExternalRequestPromise {
    return this.externalRequest[id];
  }

  public updateExternalRequest (id: string, value: Partial<ExternalRequestPromise>): void {
    const rs = this.externalRequest[id];

    if (rs) {
      for (const [_key, _value] of Object.entries(value)) {
        // @ts-ignore
        rs[_key] = _value;
      }
    }
  }

  public cleanExternalRequest (): void {
    const now = new Date().getTime();
    const map = this.externalRequest;

    const arr: string[] = [];

    const handlerPushToDelete = (key: string, value: ExternalRequestPromise) => {
      arr.push(key);
      value.resolve = undefined;
      value.reject = undefined;
    };

    for (const [key, value] of Object.entries(map)) {
      if (value.status === ExternalRequestPromiseStatus.COMPLETED || value.status === ExternalRequestPromiseStatus.REJECTED) {
        handlerPushToDelete(key, value);
      } else {
        if (now - value.createdAt > 15 * 60 * 60) {
          handlerPushToDelete(key, value);
        }
      }
    }

    for (const key of arr) {
      delete map[key];
    }
  }

  public pauseAllNetworks (code?: number, reason?: string): Promise<void[]> {
    return this.chainService.stopAllChainApis();
  }

  async resumeAllNetworks () {
    return this.chainService.resumeAllChainApis();
  }

  private publishBalance (reset?: boolean) {
    this.balanceSubject.next(this.getBalance(reset));
  }

  private publishCrowdloan (reset?: boolean) {
    this.crowdloanSubject.next(this.getCrowdloan(reset));
  }

  // private publishHistory () {
  //   this.historySubject.next(this.getHistoryMap());
  // }

  // private removeInactiveDataByChain<T> (data: Record<string, T>) {
  //   const activeData: Record<string, T> = {};
  //
  //   Object.entries(data).forEach(([networkKey, items]) => {
  //     if (this.chainService.getChainStateByKey(networkKey).active) {
  //       activeData[networkKey] = items;
  //     }
  //   });
  //
  //   return activeData;
  // }

  findNetworkKeyByGenesisHash (genesisHash?: string | null): [string | undefined, _ChainInfo | undefined] {
    if (!genesisHash) {
      return [undefined, undefined];
    }

    const rs = Object.entries(this.chainService.getChainInfoMap()).find(([networkKey, chainInfo]) => (_getSubstrateGenesisHash(chainInfo) === genesisHash));

    if (rs) {
      return rs;
    } else {
      return [undefined, undefined];
    }
  }

  findChainIdGenesisHash (genesisHash?: string | null): number | undefined {
    const chainInfo = this.findNetworkKeyByGenesisHash(genesisHash)[1];

    return chainInfo ? _getEvmChainId(chainInfo) : undefined;
  }

  findNetworkKeyByChainId (chainId?: number | null): [string | undefined, _ChainInfo | undefined] {
    if (!chainId) {
      return [undefined, undefined];
    }

    const rs = Object.entries(this.chainService.getChainInfoMap()).find(([networkKey, chainInfo]) => (_getEvmChainId(chainInfo) === chainId));

    if (rs) {
      return rs;
    } else {
      return [undefined, undefined];
    }
  }

  findSingleMode (genesisHash: string): SingleModeJson | undefined {
    const [networkKey] = this.findNetworkKeyByGenesisHash(genesisHash);

    if (!networkKey) {
      return undefined;
    }

    return (Object.values(_PREDEFINED_SINGLE_MODES)).find((item) => (item.networkKeys.includes(networkKey)));
  }

  public accountExportPrivateKey ({ address,
    password }: RequestAccountExportPrivateKey): ResponseAccountExportPrivateKey {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const exportedJson = keyring.backupAccount(keyring.getPair(address), password);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const decoded = decodePair(password, base64Decode(exportedJson.encoded), exportedJson.encoding.type);

    return {
      privateKey: u8aToHex(decoded.secretKey),
      publicKey: u8aToHex(decoded.publicKey)
    };
  }

  public checkPublicAndSecretKey ({ publicKey,
    secretKey }: RequestCheckPublicAndSecretKey): ResponseCheckPublicAndSecretKey {
    try {
      const _secret = hexStripPrefix(secretKey);

      if (_secret.length === 64) {
        const suri = `0x${_secret}`;
        const { phrase } = keyExtractSuri(suri);

        if (isHex(phrase) && isHex(phrase, 256)) {
          const type: KeypairType = 'ethereum';
          const address = keyring.createFromUri(getSuri(suri, type), {}, type).address;

          return {
            address: address,
            isValid: true,
            isEthereum: true
          };
        } else {
          return {
            address: '',
            isValid: false,
            isEthereum: true
          };
        }
      }

      const keyPair = keyring.keyring.addFromPair({ publicKey: hexToU8a(publicKey), secretKey: hexToU8a(secretKey) });

      return {
        address: keyPair.address,
        isValid: true,
        isEthereum: false
      };
    } catch (e) {
      console.error(e);

      return {
        address: '',
        isValid: false,
        isEthereum: false
      };
    }
  }

  public getEthKeyring (address: string, password: string): Promise<SimpleKeyring> {
    return new Promise<SimpleKeyring>((resolve) => {
      const { privateKey } = this.accountExportPrivateKey({ address, password: password });
      const ethKeyring = new SimpleKeyring([privateKey]);

      resolve(ethKeyring);
    });
  }

  public async evmSign (id: string, url: string, method: string, params: any, allowedAccounts: string[]): Promise<string | undefined> {
    let address = '';
    let payload: any;
    const [p1, p2] = params as [string, string];

    if (typeof p1 === 'string' && isEthereumAddress(p1)) {
      address = p1;
      payload = p2;
    } else if (typeof p2 === 'string' && isEthereumAddress(p2)) {
      address = p2;
      payload = p1;
    }

    if (address === '' || !payload) {
      throw new EvmProviderError(EvmProviderErrorType.INVALID_PARAMS, 'Not found address or payload to sign');
    }

    if (['eth_sign', 'personal_sign', 'eth_signTypedData', 'eth_signTypedData_v1', 'eth_signTypedData_v3', 'eth_signTypedData_v4'].indexOf(method) < 0) {
      throw new EvmProviderError(EvmProviderErrorType.INVALID_PARAMS, 'Not found sign method');
    }

    if (['eth_signTypedData_v3', 'eth_signTypedData_v4'].indexOf(method) > -1) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-assignment
      payload = JSON.parse(payload);
    }

    // Check sign abiblity
    if (!allowedAccounts.find((acc) => (acc.toLowerCase() === address.toLowerCase()))) {
      throw new EvmProviderError(EvmProviderErrorType.INVALID_PARAMS, 'Account ' + address + ' not in allowed list');
    }

    const validateConfirmationResponsePayload = createValidateConfirmationResponsePayload<'evmSignatureRequest'>(address);

    let meta: KeyringPair$Meta;

    try {
      const pair = keyring.getPair(address);

      if (!pair) {
        throw new EvmProviderError(EvmProviderErrorType.INVALID_PARAMS, 'Cannot find pair with address: ' + address);
      }

      meta = pair.meta;
    } catch (e) {
      throw new EvmProviderError(EvmProviderErrorType.INVALID_PARAMS, 'Cannot find pair with address: ' + address);
    }

    if (!meta.isExternal) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const signPayload = { address, type: method, payload };

      return this.requestService.addConfirmation(id, url, 'evmSignatureRequest', signPayload, {
        requiredPassword: false,
        address
      }, validateConfirmationResponsePayload)
        .then(async ({ isApproved }) => {
          if (isApproved) {
            const pair = keyring.getPair(address);

            switch (method) {
              case 'eth_sign':
              case 'personal_sign':
              case 'eth_signTypedData':
              case 'eth_signTypedData_v1':
              case 'eth_signTypedData_v3':
              case 'eth_signTypedData_v4':
                return await pair.evmSigner.signMessage(payload, method);
              default:
                throw new EvmProviderError(EvmProviderErrorType.INVALID_PARAMS, 'Not found sign method');
            }
          } else {
            throw new EvmProviderError(EvmProviderErrorType.USER_REJECTED_REQUEST);
          }
        });
    } else {
      let qrPayload = '';
      let canSign = false;

      switch (method) {
        case 'personal_sign':
          canSign = true;
          qrPayload = payload as string;
          break;
        default:
          break;
      }

      const signPayload: EvmSignatureRequestExternal = {
        address,
        type: method,
        payload: payload as unknown,
        hashPayload: qrPayload,
        canSign: canSign
      };

      return this.requestService.addConfirmation(id, url, 'evmSignatureRequestExternal', signPayload, {
        requiredPassword: false,
        address
      })
        .then(({ isApproved, signature }) => {
          if (isApproved) {
            return signature;
          } else {
            throw new EvmProviderError(EvmProviderErrorType.USER_REJECTED_REQUEST);
          }
        });
    }
  }

  public async evmSendTransaction (id: string, url: string, networkKey: string, allowedAccounts: string[], transactionParams: EvmSendTransactionParams): Promise<string | undefined> {
    const evmApi = this.getEvmApi(networkKey);
    const web3 = evmApi.api;

    const autoFormatNumber = (val?: string | number): string | undefined => {
      if (typeof val === 'string' && val.startsWith('0x')) {
        return new BN(val.replace('0x', ''), 16).toString();
      } else if (typeof val === 'number') {
        return val.toString();
      }

      return val;
    };

    if (transactionParams.from === transactionParams.to) {
      throw new EvmProviderError(EvmProviderErrorType.INVALID_PARAMS, 'From address and to address must not be the same');
    }

    const transaction: TransactionConfig = {
      from: transactionParams.from,
      to: transactionParams.to,
      value: autoFormatNumber(transactionParams.value),
      gasPrice: autoFormatNumber(transactionParams.gasPrice),
      maxPriorityFeePerGas: autoFormatNumber(transactionParams.maxPriorityFeePerGas),
      maxFeePerGas: autoFormatNumber(transactionParams.maxFeePerGas),
      data: transactionParams.data
    };

    // Calculate transaction data
    try {
      transaction.gas = await web3.eth.estimateGas({ ...transaction });
    } catch (e) {
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      throw new EvmProviderError(EvmProviderErrorType.INVALID_PARAMS, e?.message);
    }

    const gasPrice = await web3.eth.getGasPrice();

    transaction.gasPrice = gasPrice;

    const estimateGas = new BN(gasPrice.toString()).mul(new BN(transaction.gas)).toString();

    // Address is validated in before step
    const fromAddress = allowedAccounts.find((account) => (account.toLowerCase() === (transaction.from as string).toLowerCase()));

    if (!fromAddress) {
      throw new EvmProviderError(EvmProviderErrorType.INVALID_PARAMS, 'From address is not in available for ' + url);
    }

    try {
      const pair = keyring.getPair(fromAddress);

      if (!pair) {
        throw new EvmProviderError(EvmProviderErrorType.INVALID_PARAMS, 'Cannot find pair with address: ' + fromAddress);
      }
    } catch (e) {
      throw new EvmProviderError(EvmProviderErrorType.INVALID_PARAMS, 'Cannot find pair with address: ' + fromAddress);
    }

    // Validate balance
    const balance = new BN(await web3.eth.getBalance(fromAddress) || 0);

    if (balance.lt(new BN(gasPrice.toString()).mul(new BN(transaction.gas)).add(new BN(autoFormatNumber(transactionParams.value) || '0')))) {
      throw new EvmProviderError(EvmProviderErrorType.INVALID_PARAMS, 'Balance can be not enough to send transaction');
    }

    const requestPayload = { ...transaction, estimateGas };
    const transactionEmitter = await this.transactionService.addTransaction({
      transaction: requestPayload,
      address: requestPayload.from as string,
      chain: networkKey,
      url,
      data: { ...transaction },
      extrinsicType: transaction.value ? ExtrinsicType.TRANSFER_BALANCE : ExtrinsicType.EVM_EXECUTE,
      chainType: ChainType.EVM
    });

    // Wait extrinsic hash
    return new Promise((resolve, reject) => {
      transactionEmitter.on('extrinsicHash', (rs: TransactionEventResponse) => {
        resolve(rs.extrinsicHash);
      });

      // Mapping error for evmProvider
      transactionEmitter.on('error', (rs: TransactionEventResponse) => {
        let evmProviderError = new EvmProviderError(EvmProviderErrorType.INTERNAL_ERROR);

        const errorType = (rs.error?.errorType || BasicTxErrorType.INTERNAL_ERROR);

        if (errorType === BasicTxErrorType.USER_REJECT_REQUEST || errorType === BasicTxErrorType.UNABLE_TO_SIGN) {
          evmProviderError = new EvmProviderError(EvmProviderErrorType.USER_REJECTED_REQUEST);
        } else if (errorType === BasicTxErrorType.UNABLE_TO_SEND) {
          evmProviderError = new EvmProviderError(EvmProviderErrorType.INTERNAL_ERROR, rs.error?.message);
        }

        reject(evmProviderError);
      });
    });
  }

  public getConfirmationsQueueSubject (): BehaviorSubject<ConfirmationsQueue> {
    return this.requestService.confirmationsQueueSubject;
  }

  public async completeConfirmation (request: RequestConfirmationComplete) {
    return await this.requestService.completeConfirmation(request);
  }

  public onInstall () {
    const singleModes = Object.values(_PREDEFINED_SINGLE_MODES);

    const setUpSingleMode = ({ networkKeys, theme }: SingleModeJson) => {
      networkKeys.forEach((key) => {
        this.enableChain(key);
      });

      const chainInfo = this.chainService.getChainInfoByKey(networkKeys[0]);
      const genesisHash = _getSubstrateGenesisHash(chainInfo);

      this.setCurrentAccount({
        address: ALL_ACCOUNT_KEY,
        currentGenesisHash: genesisHash.length > 0 ? genesisHash : null
      });
      this.setTheme(theme);
    };

    chrome.tabs.query({}, function (tabs) {
      const openingUrls = tabs.map((t) => t.url);

      const singleMode = singleModes.find(({ autoTriggerDomain }) => {
        const urlRegex = new RegExp(autoTriggerDomain);

        return Boolean(openingUrls.find((url) => {
          return url && urlRegex.test(url);
        }));
      });

      if (singleMode) {
        // Wait for everything is ready before enable single mode
        setTimeout(() => {
          setUpSingleMode(singleMode);
        }, 999);
      }
    });
  }

  public get activeNetworks () {
    return this.chainService.getActiveChainInfos();
  }

  public get activeChainSlugs () {
    return Object.values(this.activeNetworks).map((chainInfo) => {
      return chainInfo.slug;
    });
  }

  public async sleep () {
    this.cron.stop();
    this.subscription.stop();
    await this.pauseAllNetworks(undefined, 'IDLE mode');
  }

  public async wakeup () {
    await this.resumeAllNetworks();
    this.cron.start();
    this.subscription.start();
  }

  public cancelSubscription (id: string): boolean {
    if (isSubscriptionRunning(id)) {
      unsubscribe(id);
    }

    if (this.unsubscriptionMap[id]) {
      this.unsubscriptionMap[id]();

      delete this.unsubscriptionMap[id];
    }

    return true;
  }

  public createUnsubscriptionHandle (id: string, unsubscribe: () => void): void {
    this.unsubscriptionMap[id] = unsubscribe;
  }

  public setExtraDelegationInfo (networkKey: string, address: string, collatorAddress: string): void {
    this.dbService.updateExtraDelegationInfo(networkKey, address, collatorAddress).catch((e) => this.logger.warn(e));
  }

  public async getExtraDelegationInfo (networkKey: string, address: string) {
    return await this.dbService.getExtraDelegationInfo(networkKey, address);
  }
}
