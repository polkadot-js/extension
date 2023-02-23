// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import Common from '@ethereumjs/common';
import { ChainInfoMap } from '@subwallet/chain-list';
import { _AssetType, _ChainAsset, _ChainInfo, _MultiChainAsset } from '@subwallet/chain-list/types';
import { withErrorLog } from '@subwallet/extension-base/background/handlers/helpers';
import State, { AuthUrls, Resolver } from '@subwallet/extension-base/background/handlers/State';
import { isSubscriptionRunning, unsubscribe } from '@subwallet/extension-base/background/handlers/subscriptions';
import { AccountRefMap, AddNetworkRequestExternal, AddTokenRequestExternal, APIItemState, ApiMap, AssetSetting, AuthRequestV2, BalanceItem, BalanceJson, BrowserConfirmationType, ConfirmationDefinitions, ConfirmationsQueue, ConfirmationsQueueItemOptions, ConfirmationType, CrowdloanItem, CrowdloanJson, CurrentAccountInfo, EvmSendTransactionParams, EvmSendTransactionRequestExternal, EvmSignatureRequestExternal, ExternalRequestPromise, ExternalRequestPromiseStatus, KeyringState, NftCollection, NftItem, NftJson, NftTransferExtra, PriceJson, RequestAccountExportPrivateKey, RequestCheckPublicAndSecretKey, RequestConfirmationComplete, RequestSettingsType, ResponseAccountExportPrivateKey, ResponseCheckPublicAndSecretKey, ResultResolver, ServiceInfo, SingleModeJson, StakeUnlockingJson, StakingItem, StakingJson, StakingRewardItem, StakingRewardJson, ThemeNames, TxHistoryItem, TxHistoryType, UiSettings } from '@subwallet/extension-base/background/KoniTypes';
import { AuthorizeRequest, RequestAuthorizeTab } from '@subwallet/extension-base/background/types';
import { ChainService } from '@subwallet/extension-base/services/chain-service';
import { _PREDEFINED_SINGLE_MODES } from '@subwallet/extension-base/services/chain-service/constants';
import { _ChainConnectionStatus, _ChainState, _ValidateCustomAssetRequest } from '@subwallet/extension-base/services/chain-service/types';
import { _getChainNativeTokenSlug, _getEvmChainId, _getOriginChainOfAsset, _getSubstrateGenesisHash, _isChainEnabled, _isChainEvmCompatible, _isSubstrateParachain } from '@subwallet/extension-base/services/chain-service/utils';
import DatabaseService from '@subwallet/extension-base/services/storage-service/DatabaseService';
import { Web3Transaction } from '@subwallet/extension-base/signers/types';
import { CurrentAccountStore, PriceStore } from '@subwallet/extension-base/stores';
import AccountRefStore from '@subwallet/extension-base/stores/AccountRef';
import AssetSettingStore from '@subwallet/extension-base/stores/AssetSetting';
import AuthorizeStore from '@subwallet/extension-base/stores/Authorize';
import { getId } from '@subwallet/extension-base/utils/getId';
import { getTokenPrice } from '@subwallet/extension-koni-base/api/coingecko';
import { parseTxAndSignature } from '@subwallet/extension-koni-base/api/evm/external/shared';
// eslint-disable-next-line camelcase
import { EvmRpcError } from '@subwallet/extension-koni-base/background/errors/EvmRpcError';
import { ALL_ACCOUNT_KEY, ALL_GENESIS_HASH } from '@subwallet/extension-koni-base/constants';
import { anyNumberToBN } from '@subwallet/extension-koni-base/utils/eth';
import { decodePair } from '@subwallet/keyring/pair/decode';
import { KeyringPair$Meta } from '@subwallet/keyring/types';
import { keyring } from '@subwallet/ui-keyring';
import { accounts } from '@subwallet/ui-keyring/observable/accounts';
import SimpleKeyring from 'eth-simple-keyring';
import { Transaction } from 'ethereumjs-tx';
import RLP, { Input } from 'rlp';
import { BehaviorSubject, Subject } from 'rxjs';
import { TransactionConfig, TransactionReceipt } from 'web3-core';

import { assert, BN, hexStripPrefix, hexToU8a, isHex, logger as createLogger, u8aToHex } from '@polkadot/util';
import { Logger } from '@polkadot/util/types';
import { base64Decode, isEthereumAddress, keyExtractSuri } from '@polkadot/util-crypto';
import { KeypairType } from '@polkadot/util-crypto/types';

import { KoniCron } from '../cron';
import { KoniSubscription } from '../subscription';

const ETH_DERIVE_DEFAULT = '/m/44\'/60\'/0\'/0/0';

function getSuri (seed: string, type?: KeypairType): string {
  return type === 'ethereum'
    ? `${seed}${ETH_DERIVE_DEFAULT}`
    : seed;
}

function generateDefaultCrowdloanMap () {
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
}

const createValidateConfirmationResponsePayload = <CT extends ConfirmationType>(fromAddress: string): (result: ConfirmationDefinitions[CT][1]) => Error | undefined => {
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

export default class KoniState extends State {
  private readonly unsubscriptionMap: Record<string, () => void> = {};

  public readonly authSubjectV2: BehaviorSubject<AuthorizeRequest[]> = new BehaviorSubject<AuthorizeRequest[]>([]);

  private assetSettingStore = new AssetSettingStore();
  private readonly priceStore = new PriceStore();
  private readonly currentAccountStore = new CurrentAccountStore();
  private readonly accountRefStore = new AccountRefStore();
  private readonly authorizeStore = new AuthorizeStore();
  readonly #authRequestsV2: Record<string, AuthRequestV2> = {};
  private readonly evmChainSubject = new Subject<AuthUrls>();
  private readonly authorizeUrlSubject = new Subject<AuthUrls>();
  private readonly keyringStateSubject = new Subject<KeyringState>();
  private authorizeCached: AuthUrls | undefined = undefined;

  private priceStoreReady = false;
  private externalRequest: Record<string, ExternalRequestPromise> = {};

  private keyringState: KeyringState = {
    isReady: false,
    isLocked: true,
    hasMasterPassword: false
  };

  private readonly confirmationsQueueSubject = new BehaviorSubject<ConfirmationsQueue>({
    addNetworkRequest: {},
    addTokenRequest: {},
    switchNetworkRequest: {},
    evmSignatureRequest: {},
    evmSignatureRequestExternal: {},
    evmSendTransactionRequest: {},
    evmSendTransactionRequestExternal: {}
  });

  private readonly confirmationsPromiseMap: Record<string, { resolver: Resolver<any>, validator?: (rs: any) => Error | undefined }> = {};

  private serviceInfoSubject = new Subject<ServiceInfo>();

  // TODO: refactor this
  private balanceMap: Record<string, BalanceItem> = this.generateDefaultBalanceMap();
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

  private stakingRewardSubject = new Subject<StakingRewardJson>();
  private stakingRewardState: StakingRewardJson = { ready: false, slowInterval: [], fastInterval: [] } as StakingRewardJson;

  private stakeUnlockingInfoSubject = new Subject<StakeUnlockingJson>();
  private stakeUnlockingInfo: StakeUnlockingJson = { timestamp: -1, details: [] };

  private historyMap: TxHistoryItem[] = [];
  private historySubject = new Subject<TxHistoryItem[]>();

  private lazyMap: Record<string, unknown> = {};

  // TODO: consider making chainService public (or getter) and call function directly
  private chainService: ChainService;
  public dbService: DatabaseService;
  private cron: KoniCron;
  private subscription: KoniSubscription;
  private logger: Logger;
  private ready = false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor (...args: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    super(args);
    this.dbService = new DatabaseService();

    this.chainService = new ChainService(this.dbService);
    this.subscription = new KoniSubscription(this, this.dbService);
    this.cron = new KoniCron(this, this.subscription, this.dbService);
    this.logger = createLogger('State');
    this.init();
  }

  public generateDefaultBalanceMap () {
    const balanceMap: Record<string, BalanceItem> = {};

    Object.values(ChainInfoMap).forEach((chainInfo) => {
      const nativeTokenSlug = _getChainNativeTokenSlug(chainInfo);

      balanceMap[nativeTokenSlug] = {
        tokenSlug: nativeTokenSlug,
        free: '',
        locked: '',
        state: APIItemState.PENDING
      };
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
      this.logger.log('Done init state');
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
    return this.#authRequestsV2[id];
  }

  public get numAuthRequestsV2 (): number {
    return Object.keys(this.#authRequestsV2).length;
  }

  public get allAuthRequestsV2 (): AuthorizeRequest[] {
    return Object
      .values(this.#authRequestsV2)
      .map(({ id, request, url }): AuthorizeRequest => ({ id, request, url }));
  }

  public setAuthorize (data: AuthUrls, callback?: () => void): void {
    this.authorizeStore.set('authUrls', data, () => {
      this.authorizeCached = data;
      this.evmChainSubject.next(this.authorizeCached);
      this.authorizeUrlSubject.next(this.authorizeCached);
      callback && callback();
    });
  }

  public getAuthorize (update: (value: AuthUrls) => void): void {
    // This action can be use many by DApp interaction => caching it in memory
    if (this.authorizeCached) {
      update(this.authorizeCached);
    } else {
      this.authorizeStore.get('authUrls', (data) => {
        this.authorizeCached = data;
        update(this.authorizeCached);
      });
    }
  }

  public subscribeEvmChainChange (): Subject<AuthUrls> {
    return this.evmChainSubject;
  }

  public subscribeAuthorizeUrlSubject (): Subject<AuthUrls> {
    return this.authorizeUrlSubject;
  }

  private updateIconV2 (shouldClose?: boolean): void {
    const authCount = this.numAuthRequestsV2;
    const confirmCount = this.countConfirmationNumber();
    const text = (
      authCount
        ? 'Auth'
        : confirmCount > 0 ? confirmCount.toString() : ''
    );

    withErrorLog(() => chrome.browserAction.setBadgeText({ text }));

    if (shouldClose && text === '') {
      this.popupClose();
    }
  }

  public getAuthList (): Promise<AuthUrls> {
    return new Promise<AuthUrls>((resolve, reject) => {
      this.getAuthorize((rs: AuthUrls) => {
        resolve(rs);
      });
    });
  }

  getAddressList (value = false): Record<string, boolean> {
    const addressList = Object.keys(accounts.subject.value);

    return addressList.reduce((addressList, v) => ({ ...addressList, [v]: value }), {});
  }

  private updateIconAuthV2 (shouldClose?: boolean): void {
    this.authSubjectV2.next(this.allAuthRequestsV2);
    this.updateIconV2(shouldClose);
  }

  private authCompleteV2 = (id: string, resolve: (result: boolean) => void, reject: (error: Error) => void): Resolver<ResultResolver> => {
    const isAllowedMap = this.getAddressList();

    const complete = (result: boolean | Error, cb: () => void, accounts?: string[]) => {
      const isAllowed = result === true;
      let isCancelled = false;

      if (!isAllowed && typeof result === 'object' && result.message === 'Cancelled') {
        isCancelled = true;
      }

      if (accounts && accounts.length) {
        accounts.forEach((acc) => {
          isAllowedMap[acc] = true;
        });
      } else {
        // eslint-disable-next-line no-return-assign
        Object.keys(isAllowedMap).forEach((address) => isAllowedMap[address] = false);
      }

      const { accountAuthType, idStr, request: { allowedAccounts, origin }, url } = this.#authRequestsV2[id];

      if (accountAuthType !== 'both') {
        const isEvmType = accountAuthType === 'evm';

        const backupAllowed = [...(allowedAccounts || [])].filter((a) => {
          const isEth = isEthereumAddress(a);

          return isEvmType ? !isEth : isEth;
        });

        backupAllowed.forEach((acc) => {
          isAllowedMap[acc] = true;
        });
      }

      let defaultEvmNetworkKey: string | undefined;

      if (accountAuthType === 'both' || accountAuthType === 'evm') {
        const defaultChain = Object.values(this.chainService.getChainInfoMap()).find((chainInfo) => {
          const chainState = this.chainService.getChainStateByKey(chainInfo.slug);

          return _isChainEvmCompatible(chainInfo) && _isChainEnabled(chainState);
        });

        if (defaultChain) {
          defaultEvmNetworkKey = defaultChain.slug;
        }
      }

      this.getAuthorize((value) => {
        let authorizeList = {} as AuthUrls;

        if (value) {
          authorizeList = value;
        }

        const existed = authorizeList[this.stripUrl(url)];

        // On cancel don't save anything
        if (isCancelled) {
          delete this.#authRequestsV2[id];
          this.updateIconAuthV2(true);
          cb();

          return;
        }

        authorizeList[this.stripUrl(url)] = {
          count: 0,
          id: idStr,
          isAllowed,
          isAllowedMap,
          origin,
          url,
          accountAuthType: (existed && existed.accountAuthType !== accountAuthType) ? 'both' : accountAuthType,
          currentEvmNetworkKey: existed ? existed.currentEvmNetworkKey : defaultEvmNetworkKey
        };

        this.setAuthorize(authorizeList, () => {
          cb();
          delete this.#authRequestsV2[id];
          this.updateIconAuthV2(true);
        });
      });
    };

    return {
      reject: (error: Error): void => {
        complete(error, () => {
          reject(error);
        });
      },
      resolve: ({ accounts, result }: ResultResolver): void => {
        complete(result, () => {
          resolve(result);
        }, accounts);
      }
    };
  };

  public async authorizeUrlV2 (url: string, request: RequestAuthorizeTab): Promise<boolean> {
    let authList = await this.getAuthList();
    const accountAuthType = request.accountAuthType || 'substrate';

    request.accountAuthType = accountAuthType;

    if (!authList) {
      authList = {};
    }

    const idStr = this.stripUrl(url);
    // Do not enqueue duplicate authorization requests.
    const isDuplicate = Object.values(this.#authRequestsV2)
      .some((request) => request.idStr === idStr);

    assert(!isDuplicate, `The source ${url} has a pending authorization request`);

    const existedAuth = authList[idStr];
    const existedAccountAuthType = existedAuth?.accountAuthType;
    const confirmAnotherType = existedAccountAuthType !== 'both' && existedAccountAuthType !== request.accountAuthType;

    if (request.reConfirm && existedAuth) {
      request.origin = existedAuth.origin;
    }

    // Reconfirm if check auth for empty list
    if (existedAuth) {
      const inBlackList = existedAuth && !existedAuth.isAllowed;

      if (inBlackList) {
        throw new Error(`The source ${url} is not allowed to interact with this extension`);
      }

      request.allowedAccounts = Object.entries(existedAuth.isAllowedMap)
        .map(([address, allowed]) => (allowed ? address : ''))
        .filter((item) => (item !== ''));

      let allowedListByRequestType = [...request.allowedAccounts];

      if (accountAuthType === 'evm') {
        allowedListByRequestType = allowedListByRequestType.filter((a) => isEthereumAddress(a));
      } else if (accountAuthType === 'substrate') {
        allowedListByRequestType = allowedListByRequestType.filter((a) => !isEthereumAddress(a));
      }

      if (!confirmAnotherType && !request.reConfirm && allowedListByRequestType.length !== 0) {
        // Prevent appear confirmation popup
        return false;
      }
    }

    return new Promise((resolve, reject): void => {
      const id = getId();

      this.#authRequestsV2[id] = {
        ...this.authCompleteV2(id, resolve, reject),
        id,
        idStr,
        request,
        url,
        accountAuthType: accountAuthType
      };

      this.updateIconAuthV2();

      if (Object.keys(this.#authRequestsV2).length < 2) {
        this.popupOpen();
      }
    });
  }

  public getNativeTokenInfo (networkKey: string) {
    return this.chainService.getNativeTokenInfo(networkKey);
  }

  public getChainInfo (networkKey: string) {
    return this.chainService.getChainInfoByKey(networkKey);
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

  public async getStoredStaking (address: string) {
    const items = await this.dbService.stores.staking.getDataByAddressAsObject(address);

    return items || {};
  }

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

  public ensureUrlAuthorizedV2 (url: string): Promise<boolean> {
    const idStr = this.stripUrl(url);

    return new Promise((resolve, reject) => {
      this.getAuthorize((value) => {
        if (!value) {
          value = {};
        }

        const entry = Object.keys(value).includes(idStr);

        if (!entry) {
          reject(new Error(`The source ${url} has not been enabled yet`));
        }

        const isConnected = value[idStr] && Object.keys(value[idStr].isAllowedMap)
          .some((address) => value[idStr].isAllowedMap[address]);

        if (!isConnected) {
          reject(new Error(`The source ${url} is not allowed to interact with this extension`));
        }

        resolve(true);
      });
    });
  }

  public setStakingItem (networkKey: string, item: StakingItem): void {
    this.dbService.updateStaking(networkKey, item.address, item).catch((e) => this.logger.warn(e));
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
    this.getNft().then((data) => this.nftSubject.next(data || { nftList: [], total: 0 })).catch((e) => this.logger.warn(e));

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

  public setHistory (address: string, network: string, item: TxHistoryItem | TxHistoryItem[], callback?: (items: TxHistoryItem[]) => void): void {
    let items: TxHistoryItem[];
    const nativeTokenInfo = this.chainService.getNativeTokenInfo(network);

    if (!nativeTokenInfo) {
      return;
    }

    if (item && !Array.isArray(item)) {
      item.origin = 'app';
      items = [item];
    } else {
      items = item;
    }

    items.forEach((item) => {
      item.feeSymbol = nativeTokenInfo.symbol;

      if (!item.changeSymbol) {
        item.changeSymbol = nativeTokenInfo.symbol;
      }
    });

    if (items.length) {
      this.getAccountAddress().then((currentAddress) => {
        if (currentAddress === address) {
          const oldItems = this.historyMap || [];

          this.historyMap = this.combineHistories(oldItems, items);
          this.saveHistoryToStorage(address, network, this.historyMap);
          callback && callback(this.historyMap);

          this.lazyNext('setHistory', () => {
            this.publishHistory();
          });
        } else {
          this.saveHistoryToStorage(address, network, items);
          callback && callback(this.historyMap);
        }
      }).catch((e) => this.logger.warn(e));
    }
  }

  public getCurrentAccount (update: (value: CurrentAccountInfo) => void): void {
    this.currentAccountStore.get('CurrentAccountInfo', update);
  }

  public setCurrentAccount (data: CurrentAccountInfo, callback?: () => void): void {
    const { address, currentGenesisHash } = data;

    if (address === ALL_ACCOUNT_KEY) {
      data.allGenesisHash = currentGenesisHash || undefined;
    }

    this.currentAccountStore.set('CurrentAccountInfo', data, () => {
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
      throw new EvmRpcError('INTERNAL_ERROR', `Not found ${shortenUrl} in auth list`);
    }
  }

  public async switchNetworkAccount (id: string, url: string, networkKey: string, changeAddress?: string): Promise<boolean> {
    const chainInfo = this.chainService.getChainInfoByKey(networkKey);
    const chainState = this.chainService.getChainStateByKey(networkKey);

    const { address, currentGenesisHash } = await new Promise<CurrentAccountInfo>((resolve) => {
      this.getCurrentAccount(resolve);
    });

    return this.addConfirmation(id, url, 'switchNetworkRequest', { networkKey, address: changeAddress }, { address: changeAddress })
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

    return this.addConfirmation(id, url, 'addNetworkRequest', networkData)
      .then(({ isApproved }) => {
        return isApproved;
      });
  }

  public async addTokenConfirm (id: string, url: string, tokenInfo: AddTokenRequestExternal) {
    return this.addConfirmation(id, url, 'addTokenRequest', tokenInfo)
      .then(({ isApproved }) => {
        return isApproved;
      });
  }

  public setTheme (theme: ThemeNames, callback?: (settingData: UiSettings) => void): void {
    this.getSettings((settings) => {
      const newSettings = {
        ...settings,
        theme
      };

      this.setSettings(newSettings, () => {
        callback && callback(newSettings);
      });
    });
  }

  public setBrowserConfirmationType (browserConfirmationType: BrowserConfirmationType, callback?: (settingData: UiSettings) => void): void {
    this.getSettings((settings) => {
      const newSettings = {
        ...settings,
        browserConfirmationType
      };

      this.setSettings(newSettings, () => {
        callback && callback(newSettings);
      });
    });
  }

  public subscribeSettingsSubject (): Subject<RequestSettingsType> {
    return this.settingsStore.getSubject();
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
      const networkKey = _getOriginChainOfAsset(tokenSlug);

      if (this.getChainStateByKey(networkKey).active) {
        activeBalanceMap[tokenSlug] = balanceItem;
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

  // public getTransactionHistory (address: string, networkKey: string, update: (items: TxHistoryItem[]) => void): void {
  //   const items = this.historyMap;
  //
  //   if (!items) {
  //     update([]);
  //   } else {
  //     update(items);
  //   }
  // }

  public subscribeHistory () {
    return this.historySubject;
  }

  public getHistoryMap (): TxHistoryItem[] {
    return this.removeInactiveTxHistoryByChain(this.historyMap);
  }

  private removeInactiveTxHistoryByChain (historyList: TxHistoryItem[]) {
    const activeData: TxHistoryItem[] = [];

    historyList.forEach((item) => {
      if (this.chainService.getChainStateByKey(item.networkKey) && this.chainService.getChainStateByKey(item.networkKey).active) {
        activeData.push(item);
      }
    });

    return activeData;
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
    this.chainService.upsertCustomToken(data);
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

  public upsertChainInfo (data: Record<string, any>): boolean {
    const result = this.chainService.upsertChainInfo(data);

    this.updateServiceInfo();

    return result;
  }

  public removeChain (networkKey: string): boolean {
    return this.chainService.removeChain(networkKey);
  }

  public disableChain (networkKey: string): boolean {
    const defaultChains = this.getDefaultNetworkKeys();

    return this.chainService.setChainActiveStatus(networkKey, false, defaultChains);
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

  public enableChain (networkKey: string) {
    return this.chainService.setChainActiveStatus(networkKey, true);
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

  public async resetHistoryMap (newAddress: string): Promise<void> {
    this.historyMap = [];

    const storedData = await this.getStoredHistories(newAddress);

    if (storedData) {
      this.historyMap = storedData;
    }

    this.publishHistory();
  }

  public async getStoredHistories (address: string) {
    const items = await this.dbService.stores.transaction.getHistoryByAddressAsObject(address);

    return items || [];
  }

  private saveHistoryToStorage (address: string, network: string, items: TxHistoryItem[]) {
    this.dbService.addHistories(network, address, items).catch((e) => this.logger.warn(e));
  }

  private combineHistories (oldItems: TxHistoryItem[], newItems: TxHistoryItem[]): TxHistoryItem[] {
    const newHistories = newItems.filter((item) => !oldItems.some((old) => this.isSameHistory(old, item)));

    return [...oldItems, ...newHistories].filter((his) => his.origin === 'app');
  }

  public isSameHistory (oldItem: TxHistoryItem, newItem: TxHistoryItem): boolean {
    if (oldItem.extrinsicHash === newItem.extrinsicHash && oldItem.action === newItem.action) {
      return oldItem.origin === 'app';
    }

    return false;
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

  private publishHistory () {
    this.historySubject.next(this.getHistoryMap());
  }

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

  public accountExportPrivateKey ({ address, password }: RequestAccountExportPrivateKey): ResponseAccountExportPrivateKey {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const exportedJson = keyring.backupAccount(keyring.getPair(address), password);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const decoded = decodePair(password, base64Decode(exportedJson.encoded), exportedJson.encoding.type);

    return {
      privateKey: u8aToHex(decoded.secretKey),
      publicKey: u8aToHex(decoded.publicKey)
    };
  }

  public checkPublicAndSecretKey ({ publicKey, secretKey }: RequestCheckPublicAndSecretKey): ResponseCheckPublicAndSecretKey {
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
      throw new EvmRpcError('INVALID_PARAMS', 'Not found address or payload to sign');
    }

    if (['eth_sign', 'personal_sign', 'eth_signTypedData', 'eth_signTypedData_v1', 'eth_signTypedData_v3', 'eth_signTypedData_v4'].indexOf(method) < 0) {
      throw new EvmRpcError('INVALID_PARAMS', 'Not found sign method');
    }

    if (['eth_signTypedData_v3', 'eth_signTypedData_v4'].indexOf(method) > -1) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-assignment
      payload = JSON.parse(payload);
    }

    // Check sign abiblity
    if (!allowedAccounts.find((acc) => (acc.toLowerCase() === address.toLowerCase()))) {
      throw new EvmRpcError('INVALID_PARAMS', 'Account ' + address + ' not in allowed list');
    }

    const validateConfirmationResponsePayload = createValidateConfirmationResponsePayload<'evmSignatureRequest'>(address);

    let meta: KeyringPair$Meta;

    try {
      const pair = keyring.getPair(address);

      if (!pair) {
        throw new EvmRpcError('INVALID_PARAMS', 'Cannot find pair with address: ' + address);
      }

      meta = pair.meta;
    } catch (e) {
      throw new EvmRpcError('INVALID_PARAMS', 'Cannot find pair with address: ' + address);
    }

    if (!meta.isExternal) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const signPayload = { address, type: method, payload };

      return this.addConfirmation(id, url, 'evmSignatureRequest', signPayload, { requiredPassword: true, address }, validateConfirmationResponsePayload)
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
                throw new EvmRpcError('INVALID_PARAMS', 'Not found sign method');
            }
          } else {
            throw new EvmRpcError('USER_REJECTED_REQUEST');
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

      const signPayload: EvmSignatureRequestExternal = { address, type: method, payload: payload as unknown, hashPayload: qrPayload, canSign: canSign };

      return this.addConfirmation(id, url, 'evmSignatureRequestExternal', signPayload, { requiredPassword: false, address })
        .then(({ isApproved, signature }) => {
          if (isApproved) {
            return signature;
          } else {
            throw new EvmRpcError('USER_REJECTED_REQUEST');
          }
        });
    }
  }

  public async evmSendTransaction (id: string, url: string, networkKey: string, allowedAccounts: string[], transactionParams: EvmSendTransactionParams): Promise<string | undefined> {
    const evmApi = this.getEvmApiMap()[networkKey];
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
      throw new EvmRpcError('INVALID_PARAMS', 'From address and to address must not be the same');
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
      throw new EvmRpcError('INVALID_PARAMS', e?.message);
    }

    const gasPrice = await web3.eth.getGasPrice();

    const estimateGas = new BN(gasPrice.toString()).mul(new BN(transaction.gas)).toString();

    // Address is validated in before step
    const fromAddress = allowedAccounts.find((account) => (account.toLowerCase() === (transaction.from as string).toLowerCase()));

    if (!fromAddress) {
      throw new EvmRpcError('INVALID_PARAMS', 'From address is not in available for ' + url);
    }

    let meta: KeyringPair$Meta;

    try {
      const pair = keyring.getPair(fromAddress);

      if (!pair) {
        throw new EvmRpcError('INVALID_PARAMS', 'Cannot find pair with address: ' + fromAddress);
      }

      meta = pair.meta;
    } catch (e) {
      throw new EvmRpcError('INVALID_PARAMS', 'Cannot find pair with address: ' + fromAddress);
    }

    // Validate balance
    const balance = new BN(await web3.eth.getBalance(fromAddress) || 0);

    if (balance.lt(new BN(gasPrice.toString()).mul(new BN(transaction.gas)).add(new BN(autoFormatNumber(transactionParams.value) || '0')))) {
      throw new EvmRpcError('INVALID_PARAMS', 'Balance can be not enough to send transaction');
    }

    const validateConfirmationResponsePayload = createValidateConfirmationResponsePayload<'evmSendTransactionRequest'>(fromAddress);

    const requestPayload = { ...transaction, estimateGas };

    const setTransactionHistory = (receipt: TransactionReceipt) => {
      const nativeTokenInfo = this.chainService.getNativeTokenInfo(networkKey);

      this.setHistory(fromAddress, networkKey, {
        isSuccess: true,
        time: Date.now(),
        networkKey,
        change: transaction.value?.toString() || '0',
        changeSymbol: undefined,
        fee: (receipt.gasUsed * receipt.effectiveGasPrice).toString(),
        feeSymbol: nativeTokenInfo.symbol,
        action: TxHistoryType.SEND,
        extrinsicHash: receipt.transactionHash
      });
    };

    const setFailedHistory = (transactionHash: string) => {
      const nativeTokenInfo = this.chainService.getNativeTokenInfo(networkKey);

      this.setHistory(fromAddress, networkKey, {
        isSuccess: false,
        time: Date.now(),
        networkKey,
        change: transaction.value?.toString() || '0',
        changeSymbol: undefined,
        fee: undefined,
        feeSymbol: nativeTokenInfo.symbol,
        action: TxHistoryType.SEND,
        extrinsicHash: transactionHash
      });
    };

    if (!meta.isExternal) {
      return this.addConfirmation(id, url, 'evmSendTransactionRequest', requestPayload, { requiredPassword: true, address: fromAddress, networkKey }, validateConfirmationResponsePayload)
        .then(async ({ isApproved }) => {
          if (isApproved) {
            const pair = keyring.getPair(fromAddress);

            const params = {
              ...transaction,
              gasPrice: anyNumberToBN(gasPrice).toNumber(),
              gasLimit: anyNumberToBN(estimateGas).toNumber(),
              nonce: await web3.eth.getTransactionCount(fromAddress)
            };

            console.log(params);

            const chainInfo = this.getChainInfo(networkKey);

            const common = Common.forCustomChain('mainnet', {
              name: networkKey,
              networkId: _getEvmChainId(chainInfo),
              chainId: _getEvmChainId(chainInfo)
            }, 'petersburg');

            // @ts-ignore
            const tx = new Transaction(params, { common });

            const callHash = pair.evmSigner.signTransaction(tx);
            let transactionHash = '';

            return new Promise<string>((resolve, reject) => {
              web3.eth.sendSignedTransaction(callHash)
                .once('transactionHash', (hash) => {
                  transactionHash = hash;
                  resolve(hash);
                })
                .once('receipt', setTransactionHistory)
                .once('error', (e) => {
                  console.error(e);
                  setFailedHistory(transactionHash);
                  reject(e);
                })
                .catch((e) => {
                  console.error(e);
                  setFailedHistory(transactionHash);
                  reject(e);
                });
            });
          } else {
            return Promise.reject(new EvmRpcError('USER_REJECTED_REQUEST'));
          }
        });
    } else {
      const chainInfo = this.getChainInfo(networkKey);
      const nonce = await web3.eth.getTransactionCount(fromAddress);

      const txObject: Web3Transaction = {
        nonce: nonce,
        from: fromAddress,
        gasPrice: anyNumberToBN(gasPrice).toNumber(),
        gasLimit: anyNumberToBN(transaction.gas).toNumber(),
        to: transaction.to !== undefined ? transaction.to : '',
        value: anyNumberToBN(transaction.value).toNumber(),
        data: transaction.data ? transaction.data : '',
        chainId: _getEvmChainId(chainInfo)
      };

      const data: Input = [
        txObject.nonce,
        txObject.gasPrice,
        txObject.gasLimit,
        txObject.to,
        txObject.value,
        txObject.data,
        txObject.chainId,
        new Uint8Array([0x00]),
        new Uint8Array([0x00])
      ];

      const encoded = RLP.encode(data);

      const requestPayload: EvmSendTransactionRequestExternal = {
        ...transaction,
        estimateGas,
        hashPayload: u8aToHex(encoded),
        canSign: true
      };

      return this.addConfirmation(id, url, 'evmSendTransactionRequestExternal', requestPayload, { requiredPassword: false, address: fromAddress, networkKey })
        .then(async ({ isApproved, signature }) => {
          if (isApproved) {
            let transactionHash = '';

            const signed = parseTxAndSignature(txObject, signature);

            const recover = web3.eth.accounts.recoverTransaction(signed);

            if (recover.toLowerCase() !== fromAddress.toLowerCase()) {
              return Promise.reject(new EvmRpcError('UNAUTHORIZED', 'Bad signature'));
            }

            return new Promise<string>((resolve, reject) => {
              web3.eth.sendSignedTransaction(signed)
                .once('transactionHash', (hash) => {
                  transactionHash = hash;
                  resolve(hash);
                })
                .once('receipt', setTransactionHistory)
                .once('error', (e) => {
                  setFailedHistory(transactionHash);
                  reject(e);
                }).catch((e) => {
                  setFailedHistory(transactionHash);
                  reject(e);
                });
            });
          } else {
            return Promise.reject(new EvmRpcError('USER_REJECTED_REQUEST'));
          }
        });
    }
  }

  public getConfirmationsQueueSubject () {
    return this.confirmationsQueueSubject;
  }

  public countConfirmationNumber () {
    let count = 0;

    count += this.allAuthRequests.length;
    count += this.allMetaRequests.length;
    count += this.allSignRequests.length;
    count += this.allAuthRequestsV2.length;
    Object.values(this.confirmationsQueueSubject.getValue()).forEach((x) => {
      count += Object.keys(x).length;
    });

    return count;
  }

  public addConfirmation<CT extends ConfirmationType> (id: string, url: string, type: CT, payload: ConfirmationDefinitions[CT][0]['payload'], options: ConfirmationsQueueItemOptions = {}, validator?: (input: ConfirmationDefinitions[CT][1]) => Error | undefined) {
    const confirmations = this.confirmationsQueueSubject.getValue();
    const confirmationType = confirmations[type] as Record<string, ConfirmationDefinitions[CT][0]>;
    const payloadJson = JSON.stringify(payload);

    // Check duplicate request
    const duplicated = Object.values(confirmationType).find((c) => (c.url === url) && (c.payloadJson === payloadJson));

    if (duplicated) {
      throw new EvmRpcError('INVALID_PARAMS', 'Duplicate request information');
    }

    confirmationType[id] = {
      id,
      url,
      payload,
      payloadJson,
      ...options
    } as ConfirmationDefinitions[CT][0];

    const promise = new Promise<ConfirmationDefinitions[CT][1]>((resolve, reject) => {
      this.confirmationsPromiseMap[id] = {
        validator: validator,
        resolver: {
          resolve: resolve,
          reject: reject
        }
      };
    });

    this.confirmationsQueueSubject.next(confirmations);

    // Not open new popup and use existed
    const popupList = this.getPopup();

    if (this.getPopup().length > 0) {
      // eslint-disable-next-line no-void
      void chrome.windows.update(popupList[0], { focused: true });
    } else {
      this.popupOpen();
    }

    this.updateIconV2();

    return promise;
  }

  public completeConfirmation (request: RequestConfirmationComplete) {
    const confirmations = this.confirmationsQueueSubject.getValue();

    const _completeConfirmation = <T extends ConfirmationType> (type: T, result: ConfirmationDefinitions[T][1]) => {
      const { id } = result;
      const { resolver, validator } = this.confirmationsPromiseMap[id];

      if (!resolver || !(confirmations[type][id])) {
        this.logger.error('Not found confirmation', type, id);
        throw new Error('Not found promise for confirmation');
      }

      // Validate response from confirmation popup some info like password, response format....
      const error = validator && validator(result);

      if (error) {
        resolver.reject(error);
      }

      // Delete confirmations from queue
      delete this.confirmationsPromiseMap[id];
      delete confirmations[type][id];
      this.confirmationsQueueSubject.next(confirmations);

      // Update icon, and close queue
      this.updateIconV2(this.countConfirmationNumber() === 0);
      resolver.resolve(result);
    };

    Object.entries(request).forEach(([type, result]) => {
      if (type === 'addNetworkRequest') {
        _completeConfirmation(type, result as ConfirmationDefinitions['addNetworkRequest'][1]);
      } else if (type === 'addTokenRequest') {
        _completeConfirmation(type, result as ConfirmationDefinitions['addTokenRequest'][1]);
      } else if (type === 'switchNetworkRequest') {
        _completeConfirmation(type, result as ConfirmationDefinitions['switchNetworkRequest'][1]);
      } else if (type === 'evmSignatureRequest') {
        _completeConfirmation(type, result as ConfirmationDefinitions['evmSignatureRequest'][1]);
      } else if (type === 'evmSignatureRequestExternal') {
        _completeConfirmation(type, result as ConfirmationDefinitions['evmSignatureRequestExternal'][1]);
      } else if (type === 'evmSendTransactionRequest') {
        _completeConfirmation(type, result as ConfirmationDefinitions['evmSendTransactionRequest'][1]);
      } else if (type === 'evmSendTransactionRequestExternal') {
        _completeConfirmation(type, result as ConfirmationDefinitions['evmSendTransactionRequestExternal'][1]);
      }
    });

    return true;
  }

  public onInstall () {
    const singleModes = Object.values(_PREDEFINED_SINGLE_MODES);

    const setUpSingleMode = ({ networkKeys, theme }: SingleModeJson) => {
      networkKeys.forEach((key) => {
        this.enableChain(key);
      });

      const chainInfo = this.chainService.getChainInfoByKey(networkKeys[0]);
      const genesisHash = _getSubstrateGenesisHash(chainInfo);

      this.setCurrentAccount({ address: ALL_ACCOUNT_KEY, currentGenesisHash: genesisHash.length > 0 ? genesisHash : null });
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
