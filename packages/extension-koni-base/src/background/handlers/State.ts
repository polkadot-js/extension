// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { withErrorLog } from '@subwallet/extension-base/background/handlers/helpers';
import State, { AuthUrls, Resolver } from '@subwallet/extension-base/background/handlers/State';
import { AccountRefMap, APIItemState, ApiMap, AuthRequestV2, BalanceItem, BalanceJson, ChainRegistry, ConfirmationDefinitions, ConfirmationsQueue, ConfirmationsQueueItemOptions, ConfirmationType, CrowdloanItem, CrowdloanJson, CurrentAccountInfo, CustomEvmToken, DeleteEvmTokenParams, EvmSendTransactionParams, EvmTokenJson, NETWORK_STATUS, NetworkJson, NftCollection, NftCollectionJson, NftItem, NftJson, NftTransferExtra, PriceJson, RequestAccountExportPrivateKey, RequestConfirmationComplete, RequestSettingsType, ResponseAccountExportPrivateKey, ResultResolver, ServiceInfo, StakingItem, StakingJson, StakingRewardJson, TokenInfo, TransactionHistoryItemType } from '@subwallet/extension-base/background/KoniTypes';
import { AuthorizeRequest, RequestAuthorizeTab } from '@subwallet/extension-base/background/types';
import { getId } from '@subwallet/extension-base/utils/getId';
import { getTokenPrice } from '@subwallet/extension-koni-base/api/coingecko';
import { initApi } from '@subwallet/extension-koni-base/api/dotsama';
import { cacheRegistryMap, getRegistry } from '@subwallet/extension-koni-base/api/dotsama/registry';
import { PREDEFINED_GENESIS_HASHES, PREDEFINED_NETWORKS } from '@subwallet/extension-koni-base/api/predefinedNetworks';
import { DEFAULT_STAKING_NETWORKS } from '@subwallet/extension-koni-base/api/staking';
// eslint-disable-next-line camelcase
import { DotSamaCrowdloan_crowdloans_nodes } from '@subwallet/extension-koni-base/api/subquery/__generated__/DotSamaCrowdloan';
import { fetchDotSamaCrowdloan } from '@subwallet/extension-koni-base/api/subquery/crowdloan';
import { DEFAULT_EVM_TOKENS } from '@subwallet/extension-koni-base/api/web3/defaultEvmToken';
import { initWeb3Api } from '@subwallet/extension-koni-base/api/web3/web3';
import { EvmRpcError } from '@subwallet/extension-koni-base/background/errors/EvmRpcError';
import { ALL_ACCOUNT_KEY, ALL_GENESIS_HASH } from '@subwallet/extension-koni-base/constants';
import { CurrentAccountStore, NetworkMapStore, PriceStore } from '@subwallet/extension-koni-base/stores';
import AccountRefStore from '@subwallet/extension-koni-base/stores/AccountRef';
import AuthorizeStore from '@subwallet/extension-koni-base/stores/Authorize';
import BalanceStore from '@subwallet/extension-koni-base/stores/Balance';
import CrowdloanStore from '@subwallet/extension-koni-base/stores/Crowdloan';
import CustomEvmTokenStore from '@subwallet/extension-koni-base/stores/CustomEvmToken';
import NftStore from '@subwallet/extension-koni-base/stores/Nft';
import NftCollectionStore from '@subwallet/extension-koni-base/stores/NftCollection';
import SettingsStore from '@subwallet/extension-koni-base/stores/Settings';
import StakingStore from '@subwallet/extension-koni-base/stores/Staking';
import TransactionHistoryStore from '@subwallet/extension-koni-base/stores/TransactionHistoryV2';
import { convertFundStatus, getCurrentProvider, mergeNetworkProviders } from '@subwallet/extension-koni-base/utils/utils';
import SimpleKeyring from 'eth-simple-keyring';
import { BehaviorSubject, Subject } from 'rxjs';
import Web3 from 'web3';
import { TransactionConfig, TransactionReceipt } from 'web3-core';

import { decodePair } from '@polkadot/keyring/pair/decode';
import { keyring } from '@polkadot/ui-keyring';
import { accounts } from '@polkadot/ui-keyring/observable/accounts';
import { assert, BN, u8aToHex } from '@polkadot/util';
import { base64Decode, isEthereumAddress } from '@polkadot/util-crypto';

function generateDefaultStakingMap () {
  const stakingMap: Record<string, StakingItem> = {};

  Object.keys(DEFAULT_STAKING_NETWORKS).forEach((networkKey) => {
    stakingMap[networkKey] = {
      name: PREDEFINED_NETWORKS[networkKey].chain,
      chainId: networkKey,
      nativeToken: PREDEFINED_NETWORKS[networkKey].nativeToken,
      state: APIItemState.PENDING
    } as StakingItem;
  });

  return stakingMap;
}

function generateDefaultCrowdloanMap () {
  const crowdloanMap: Record<string, CrowdloanItem> = {};

  Object.keys(PREDEFINED_NETWORKS).forEach((networkKey) => {
    crowdloanMap[networkKey] = {
      state: APIItemState.PENDING,
      contribute: '0'
    };
  });

  return crowdloanMap;
}

export default class KoniState extends State {
  public readonly authSubjectV2: BehaviorSubject<AuthorizeRequest[]> = new BehaviorSubject<AuthorizeRequest[]>([]);

  private readonly balanceStore = new BalanceStore();
  private readonly crowdloanStore = new CrowdloanStore();
  private readonly stakingStore = new StakingStore();
  private readonly nftStore = new NftStore();
  private readonly nftCollectionStore = new NftCollectionStore();
  private readonly networkMapStore = new NetworkMapStore(); // persist custom networkMap by user
  private readonly customEvmTokenStore = new CustomEvmTokenStore();
  private readonly priceStore = new PriceStore();
  private readonly currentAccountStore = new CurrentAccountStore();
  private readonly settingsStore = new SettingsStore();
  private readonly accountRefStore = new AccountRefStore();
  private readonly authorizeStore = new AuthorizeStore();
  readonly #authRequestsV2: Record<string, AuthRequestV2> = {};
  private readonly evmChainSubject = new Subject<AuthUrls>();
  private authorizeCached: AuthUrls | undefined = undefined;

  private priceStoreReady = false;
  private readonly transactionHistoryStore = new TransactionHistoryStore();

  private readonly confirmationsQueueSubject = new BehaviorSubject<ConfirmationsQueue>({
    addNetworkRequest: {},
    addTokenRequest: {},
    switchNetworkRequest: {},
    evmSignatureRequest: {},
    evmSendTransactionRequest: {}
  });

  private readonly confirmationsPromiseMap: Record<string, { resolver: Resolver<any>, validator?: (rs: any) => Error | undefined }> = {};

  private networkMap: Record<string, NetworkJson> = {}; // mapping to networkMapStore, for uses in background
  private networkMapSubject = new Subject<Record<string, NetworkJson>>();
  private lockNetworkMap = false;

  private apiMap: ApiMap = { dotSama: {}, web3: {} };

  private serviceInfoSubject = new Subject<ServiceInfo>();

  private evmTokenState: EvmTokenJson = { erc20: [], erc721: [] };
  private evmTokenSubject = new Subject<EvmTokenJson>();

  private balanceMap: Record<string, BalanceItem> = this.generateDefaultBalanceMap();
  private balanceSubject = new Subject<BalanceJson>();

  // eslint-disable-next-line camelcase
  private crowdloanFundMap: Record<string, DotSamaCrowdloan_crowdloans_nodes> = {};
  private crowdloanMap: Record<string, CrowdloanItem> = generateDefaultCrowdloanMap();
  private crowdloanSubject = new Subject<CrowdloanJson>();

  private nftTransferSubject = new Subject<NftTransferExtra>();
  // Only for rendering nft after transfer
  private nftTransferState: NftTransferExtra = {
    cronUpdate: false,
    forceUpdate: false
  };

  private nftState: NftJson = {
    total: 0,
    nftList: []
  };

  private nftCollectionState: NftCollectionJson = {
    ready: false,
    nftCollectionList: []
  };

  private nftSubject = new Subject<NftJson>();
  private nftCollectionSubject = new Subject<NftCollectionJson>();

  private stakingSubject = new Subject<StakingJson>();
  private stakingRewardSubject = new Subject<StakingRewardJson>();
  private stakingMap: Record<string, StakingItem> = generateDefaultStakingMap();
  private stakingRewardState: StakingRewardJson = {
    ready: false,
    details: []
  } as StakingRewardJson;

  private historyMap: Record<string, TransactionHistoryItemType[]> = {};
  private historySubject = new Subject<Record<string, TransactionHistoryItemType[]>>();

  private chainRegistryMap: Record<string, ChainRegistry> = {};
  private chainRegistrySubject = new Subject<Record<string, ChainRegistry>>();

  private lazyMap: Record<string, unknown> = {};

  public generateDefaultBalanceMap () {
    const balanceMap: Record<string, BalanceItem> = {};

    Object.values(this.networkMap).forEach((networkJson) => {
      if (networkJson.active) {
        balanceMap[networkJson.key] = {
          state: APIItemState.PENDING
        };
      }
    });

    return balanceMap;
  }

  // init networkMap, apiMap and chainRegistry (first time only)
  // TODO: merge transactionHistory when custom network -> predefined network
  public initNetworkStates () {
    this.networkMapStore.get('NetworkMap', (storedNetworkMap) => {
      if (!storedNetworkMap) { // first time init extension
        this.networkMapStore.set('NetworkMap', PREDEFINED_NETWORKS);
        this.networkMap = PREDEFINED_NETWORKS;
      } else { // merge custom providers in stored data with predefined data
        const mergedNetworkMap: Record<string, NetworkJson> = PREDEFINED_NETWORKS;

        for (const [key, storedNetwork] of Object.entries(storedNetworkMap)) {
          if (key in PREDEFINED_NETWORKS) {
            // check change and override custom providers if exist
            if ('customProviders' in storedNetwork) {
              mergedNetworkMap[key].customProviders = storedNetwork.customProviders;
              mergedNetworkMap[key].currentProvider = storedNetwork.currentProvider;
            }

            if (key !== 'polkadot' && key !== 'kusama') {
              mergedNetworkMap[key].active = storedNetwork.active;
            }

            mergedNetworkMap[key].coinGeckoKey = storedNetwork.coinGeckoKey;
            mergedNetworkMap[key].crowdloanUrl = storedNetwork.crowdloanUrl;
            mergedNetworkMap[key].blockExplorer = storedNetwork.blockExplorer;
            mergedNetworkMap[key].currentProviderMode = mergedNetworkMap[key].currentProvider.startsWith('http') ? 'http' : 'ws';
          } else {
            if (Object.keys(PREDEFINED_GENESIS_HASHES).includes(storedNetwork.genesisHash)) { // merge networks with same genesis hash
              // @ts-ignore
              const targetKey = PREDEFINED_GENESIS_HASHES[storedNetwork.genesisHash];

              const { currentProviderMethod, parsedCustomProviders, parsedProviderKey } = mergeNetworkProviders(storedNetwork, PREDEFINED_NETWORKS[targetKey]);

              mergedNetworkMap[targetKey].customProviders = parsedCustomProviders;
              mergedNetworkMap[targetKey].currentProvider = parsedProviderKey;
              mergedNetworkMap[targetKey].active = storedNetwork.active;
              // @ts-ignore
              mergedNetworkMap[targetKey].currentProviderMode = currentProviderMethod;
            } else {
              mergedNetworkMap[key] = storedNetwork;
            }
          }
        }

        this.networkMapStore.set('NetworkMap', mergedNetworkMap);
        this.networkMap = mergedNetworkMap; // init networkMap state
      }

      for (const [key, network] of Object.entries(this.networkMap)) {
        if (network.active) {
          this.apiMap.dotSama[key] = initApi(key, getCurrentProvider(network), network.isEthereum);

          if (network.isEthereum && network.isEthereum) {
            this.apiMap.web3[key] = initWeb3Api(getCurrentProvider(network));
          }
        }
      }

      this.initEvmTokenState();
    });
  }

  public initEvmTokenState () {
    this.customEvmTokenStore.get('EvmToken', (storedEvmTokens) => {
      if (!storedEvmTokens) {
        this.evmTokenState = DEFAULT_EVM_TOKENS;
      } else {
        const _evmTokenState = storedEvmTokens;

        for (const storedToken of DEFAULT_EVM_TOKENS.erc20) {
          let exist = false;

          for (const defaultToken of storedEvmTokens.erc20) {
            if (defaultToken.smartContract === storedToken.smartContract && defaultToken.chain === storedToken.chain) {
              exist = true;
              break;
            }
          }

          if (!exist) {
            _evmTokenState.erc20.push(storedToken);
          }
        }

        for (const storedToken of DEFAULT_EVM_TOKENS.erc721) {
          let exist = false;

          for (const defaultToken of storedEvmTokens.erc721) {
            if (defaultToken.smartContract === storedToken.smartContract && defaultToken.chain === storedToken.chain) {
              exist = true;
              break;
            }
          }

          if (!exist) {
            _evmTokenState.erc721.push(storedToken);
          }
        }

        // Update networkKey in case networkMap change
        for (const token of _evmTokenState.erc20) {
          if (!(token.chain in this.networkMap)) {
            let newKey = '';
            const genesisHash = token.chain.split('custom_')[1]; // token from custom network has key with prefix custom_

            for (const [key, network] of Object.entries(this.networkMap)) {
              if (network.genesisHash.toLowerCase() === genesisHash.toLowerCase()) {
                newKey = key;
                break;
              }
            }

            token.chain = newKey;
          }
        }

        for (const token of _evmTokenState.erc721) {
          if (!(token.chain in this.networkMap)) {
            let newKey = '';
            const genesisHash = token.chain.split('custom_')[1]; // token from custom network has key with prefix custom_

            for (const [key, network] of Object.entries(this.networkMap)) {
              if (network.genesisHash.toLowerCase() === genesisHash.toLowerCase()) {
                newKey = key;
                break;
              }
            }

            token.chain = newKey;
          }
        }

        this.evmTokenState = _evmTokenState;
      }

      this.customEvmTokenStore.set('EvmToken', this.evmTokenState);
      this.evmTokenSubject.next(this.evmTokenState);

      this.initChainRegistry();
    });
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

          return;
        }

        authorizeList[this.stripUrl(url)] = {
          count: 0,
          id: idStr,
          isAllowed,
          isAllowedMap,
          origin,
          url,
          accountAuthType: (existed && existed.accountAuthType !== accountAuthType) ? 'both' : accountAuthType
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

    if (existedAuth && !confirmAnotherType && !request.reConfirm) {
      // this url was seen in the past
      const isConnected = Object.keys(existedAuth.isAllowedMap)
        .some((address) => existedAuth.isAllowedMap[address]);

      assert(isConnected, `The source ${url} is not allowed to interact with this extension`);

      return false;
    }

    return new Promise((resolve, reject): void => {
      const id = getId();

      if (existedAuth) {
        request.allowedAccounts = Object.entries(existedAuth.isAllowedMap)
          .map(([address, allowed]) => (allowed ? address : ''))
          .filter((item) => (item !== ''));
      }

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

  public getStaking (): StakingJson {
    return { ready: true, details: this.stakingMap } as StakingJson;
  }

  public async getStoredStaking (address: string) {
    const items = await this.stakingStore.asyncGet(address);

    return items || {};
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

  private hasUpdateStakingItem (networkKey: string, item: StakingItem): boolean {
    if (item.state !== APIItemState.READY) {
      return false;
    }

    const oldItem = this.stakingMap[networkKey];

    return oldItem?.balance !== item?.balance || !oldItem || oldItem?.state === APIItemState.PENDING;
  }

  public setStakingItem (networkKey: string, item: StakingItem): void {
    const itemData = { ...item, timestamp: +new Date() };

    if (this.hasUpdateStakingItem(networkKey, item)) {
      // Update staking map
      this.stakingMap[networkKey] = itemData;

      this.lazyNext('setStakingItem', () => {
        this.updateStakingStore();
        this.publishStaking(this.stakingMap);
      });
    }
  }

  private updateStakingStore () {
    const readyMap: Record<string, StakingItem> = {};

    Object.entries(this.stakingMap).forEach(([key, item]) => {
      if (item.state === APIItemState.READY) {
        readyMap[key] = item;
      }
    });

    if (Object.keys(readyMap).length > 0) {
      this.getCurrentAccount((currentAccountInfo) => {
        this.stakingStore.set(currentAccountInfo.address, readyMap);
      });
    }
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

  public setNftCollection (address: string, data: NftCollectionJson, callback?: (data: NftCollectionJson) => void): void {
    this.getCurrentAccount((currentAccountInfo) => {
      if (currentAccountInfo.address === address) {
        this.nftCollectionState = data;

        if (callback) {
          callback(data);
        }

        this.publishNftCollectionChanged(address);
      }
    });
  }

  public updateNftCollection (address: string, data: NftCollection, callback?: (data: NftCollection) => void): void {
    this.getCurrentAccount((currentAccountInfo) => {
      if (currentAccountInfo.address === address) {
        const existedItemIndex = this.nftCollectionState.nftCollectionList.findIndex((col) => col.chain === data.chain && col.collectionId === data.collectionId);

        if (existedItemIndex >= 0) {
          // Update to existed data
          if (data.collectionName && data.image) {
            this.nftCollectionState.nftCollectionList[existedItemIndex] = data;
          }
        } else {
          this.nftCollectionState.nftCollectionList.push(data);
        }

        if (callback) {
          callback(data);
        }

        this.publishNftCollectionChanged(address);
      } else {
        this.nftCollectionStore.asyncGet(address).then((storedData: NftCollection[]) => {
          if (!storedData.some((col) => col.chain === data.chain && col.collectionId === data.collectionId)) {
            storedData.push(data);
            this.nftCollectionStore.set(address, storedData);
          }
        }).catch((err) => console.warn(err));
      }
    });
  }

  public updateNftReady (address: string, ready: boolean, callback?: (ready: boolean) => void): void {
    this.getCurrentAccount((currentAccountInfo) => {
      if (currentAccountInfo.address === address) {
        if (callback) {
          callback(ready);
        }

        if (this.nftCollectionState.ready !== ready) {
          this.nftCollectionState.ready = ready;

          this.publishNftCollectionChanged(address);
        }
      }
    });
  }

  private publishNftCollectionChanged (address: string) {
    this.lazyNext('saveNftCollection', () => {
      this.saveNftCollection(address);
      this.nftCollectionState.nftCollectionList = this.nftCollectionState.nftCollectionList.filter((item) => item.chain && this.networkMap[item.chain]?.active);

      this.nftCollectionSubject.next(this.nftCollectionState);
    });
  }

  private saveNftCollection (address: string, clear = false) {
    if (clear) {
      this.nftCollectionStore.remove(address);
    } else if (this.nftCollectionState.ready && this.nftCollectionState.nftCollectionList) {
      this.nftCollectionStore.set(address, this.nftCollectionState.nftCollectionList);
    }
  }

  public async resetNftCollection (newAddress: string): Promise<void> {
    this.nftCollectionState = {
      ready: false,
      nftCollectionList: []
    } as NftCollectionJson;

    const storedData = await this.getStoredNftCollection(newAddress);

    if (storedData) {
      this.nftCollectionState.ready = true;
      this.nftCollectionState.nftCollectionList = storedData;
    }

    this.nftCollectionSubject.next(this.nftCollectionState);
  }

  public getNftCollection () {
    return this.nftCollectionState;
  }

  public async getStoredNftCollection (address: string) {
    const items = await this.nftCollectionStore.asyncGet(address);

    return items;
  }

  public getNftCollectionSubscription (update: (value: NftCollectionJson) => void): void {
    update(this.nftCollectionState);
  }

  public subscribeNftCollection () {
    return this.nftCollectionSubject;
  }

  public async resetNft (newAddress: string): Promise<void> {
    this.nftState = {
      total: 0,
      nftList: []
    } as NftJson;

    const storedData = await this.getStoredNft(newAddress);

    if (storedData) {
      storedData.nftList = storedData.nftList.filter((item) => item.chain && this.networkMap[item.chain]?.active);
      storedData.total = storedData.nftList.length;
      this.nftState = storedData;
    }

    this.nftSubject.next(this.nftState);
  }

  // For NFT transfer
  public setNft (address: string, data: NftJson, callback?: (nftData: NftJson) => void): void {
    this.getCurrentAccount((currentAccountInfo) => {
      if (currentAccountInfo.address === address) {
        this.nftState = data;

        if (callback) {
          callback(data);
        }

        this.publishNftChanged(address);
      }
    });
  }

  public updateNftData (address: string, nftData: NftItem, callback?: (nftData: NftItem) => void): void {
    this.getCurrentAccount((currentAccountInfo) => {
      if (currentAccountInfo.address === address) {
        const existedItemIndex = this.nftState.nftList.findIndex((nft) => this.isSameNft(nft, nftData));

        if (existedItemIndex >= 0) {
          // Update to existed data
          this.nftState.nftList[existedItemIndex] = nftData;
        } else {
          this.nftState.nftList.push(nftData);
        }

        if (callback) {
          callback(nftData);
        }

        this.publishNftChanged(address);
      } else {
        this.nftStore.asyncGet(address).then((data: NftJson) => {
          if (!data.nftList.some((nft) => this.isSameNft(nft, nftData))) {
            data.total += 1;
            data.nftList.push(nftData);

            this.nftStore.set(address, data);
          }
        }).catch((err) => console.warn(err));
      }
    });
  }

  public updateNftIds (chain: string, address: string, collectionId?: string, nftIds?: string[]): void {
    this.getCurrentAccount((currentAccountInfo) => {
      if (currentAccountInfo.address === address) {
        if (!collectionId) {
          // Clear all nfts from chain
          this.nftState.nftList = this.nftState.nftList.filter((nft) => nft.chain !== chain);
        } else {
          this.nftState.nftList = this.nftState.nftList.filter((nft) => !(nft.chain === chain &&
          nft.collectionId === collectionId &&
          !nftIds?.includes(nft?.id || '')));
        }

        this.publishNftChanged(address);
      }
    });
  }

  public updateCollectionIds (chain: string, address: string, collectionIds?: string[]): void {
    this.getCurrentAccount((currentAccountInfo) => {
      if (currentAccountInfo.address === address) {
        if (!collectionIds?.length) {
          // Clear all nfts from chain
          this.nftState.nftList = this.nftState.nftList.filter((nft) => nft.chain !== chain);
        } else {
          this.nftState.nftList = this.nftState.nftList.filter((nft) => !(nft.chain === chain &&
          !collectionIds?.includes(nft?.collectionId || '')));
        }

        this.publishNftChanged(address);
      }
    });
  }

  public resetMasterNftStore (): void {
    this.saveNft(ALL_ACCOUNT_KEY, true);
    this.saveNftCollection(ALL_ACCOUNT_KEY, true);
  }

  public removeNftFromMasterStore (nftData: NftItem): void {
    this.nftStore.asyncGet(ALL_ACCOUNT_KEY).then((data: NftJson) => {
      if (data.nftList.some((nft) => this.isSameNft(nft, nftData))) {
        data.nftList = data.nftList.filter((nft) => nft.id !== nftData.id);
        data.total = data.nftList.length;
        this.nftStore.set(ALL_ACCOUNT_KEY, data);
      }
    }).catch((err) => console.warn(err));
  }

  private publishNftChanged (address: string) {
    this.lazyNext('saveNft', () => {
      if (this.nftState.nftList.length) {
        this.nftState.nftList = this.nftState.nftList.filter((item, index) => {
          return this.nftState.nftList.indexOf(item) === index;
        });
      }

      this.saveNft(address);
      this.nftState.nftList = this.nftState.nftList.filter((item) => item.chain && this.networkMap[item.chain]?.active);
      this.nftState.total = this.nftState.nftList.length;

      this.nftSubject.next(this.nftState);
    });
  }

  private saveNft (address: string, clear = false) {
    if (clear) {
      this.nftStore.remove(address);
    } else if (this.nftState && this.nftState.nftList) {
      this.nftState.total = this.nftState.nftList.length;
      this.nftStore.set(address, this.nftState);
    }
  }

  public getNft () {
    return this.nftState;
  }

  public async getStoredNft (address: string) {
    const items = await this.nftStore.asyncGet(address);

    return items;
  }

  public getNftSubscription (update: (value: NftJson) => void): void {
    update(this.nftState);
  }

  public subscribeNft () {
    return this.nftSubject;
  }

  public setStakingReward (stakingRewardData: StakingRewardJson, callback?: (stakingRewardData: StakingRewardJson) => void): void {
    this.stakingRewardState = stakingRewardData;

    if (callback) {
      callback(stakingRewardData);
    }

    this.stakingRewardSubject.next(stakingRewardData);
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

  public setHistory (address: string, network: string, histories: TransactionHistoryItemType[]) {
    if (histories.length) {
      const oldItems = this.historyMap[network] || [];

      const comnbinedHistories = this.combineHistories(oldItems, histories);

      this.historyMap[network] = comnbinedHistories;

      this.lazyNext('setHistory', () => {
        // Save to storage
        this.saveHistoryToStorage(address);
        this.publishHistory(this.getHistoryMap());
      });
    }
  }

  public getCurrentAccount (update: (value: CurrentAccountInfo) => void): void {
    this.currentAccountStore.get('CurrentAccountInfo', update);
  }

  public setCurrentAccount (data: CurrentAccountInfo, callback?: () => void): void {
    this.currentAccountStore.set('CurrentAccountInfo', data, callback);

    this.updateServiceInfo();
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

    if (authUrls[shortenUrl]) {
      if (this.networkMap[networkKey] && !this.networkMap[networkKey].active) {
        this.enableNetworkMap(networkKey);
      }

      authUrls[shortenUrl].currentEvmNetworkKey = networkKey;
      this.setAuthorize(authUrls);
    } else {
      throw new EvmRpcError('INTERNAL_ERROR', `Not found ${shortenUrl} in auth list`);
    }
  }

  public async switchNetworkAccount (id: string, url: string, networkKey: string, changeAddress?: string): Promise<boolean> {
    const selectNetwork = this.getNetworkMap()[networkKey];

    const { address, currentGenesisHash } = await new Promise<CurrentAccountInfo>((resolve) => {
      this.getCurrentAccount(resolve);
    });

    return this.addConfirmation(id, url, 'switchNetworkRequest', { networkKey, address: changeAddress }, { address: changeAddress })
      .then(({ isApproved }) => {
        if (isApproved) {
          const useAddress = changeAddress || address;

          if (this.networkMap[networkKey] && !this.networkMap[networkKey].active) {
            this.enableNetworkMap(networkKey);
          }

          if (useAddress !== ALL_ACCOUNT_KEY) {
            const pair = keyring.getPair(useAddress);

            assert(pair, 'Unable to find pair');

            keyring.saveAccountMeta(pair, { ...pair.meta, genesisHash: selectNetwork?.genesisHash });
          }

          if (address !== changeAddress || selectNetwork?.genesisHash !== currentGenesisHash || isApproved) {
            this.setCurrentAccount({
              address: useAddress,
              currentGenesisHash: selectNetwork?.genesisHash
            });
          }
        }

        return isApproved;
      });
  }

  public async addNetworkConfirm (id: string, url: string, networkData: NetworkJson) {
    networkData.requestId = id;

    return this.addConfirmation(id, url, 'addNetworkRequest', networkData)
      .then(({ isApproved }) => {
        return isApproved;
      });
  }

  public async addTokenConfirm (id: string, url: string, tokenInfo: CustomEvmToken) {
    return this.addConfirmation(id, url, 'addTokenRequest', tokenInfo)
      .then(({ isApproved }) => {
        return isApproved;
      });
  }

  public getSettings (update: (value: RequestSettingsType) => void): void {
    this.settingsStore.get('Settings', (value) => {
      if (!value) {
        update({ isShowBalance: false, accountAllLogo: '', theme: 'dark' });
      } else {
        update(value);
      }
    });
  }

  public setSettings (data: RequestSettingsType, callback?: () => void): void {
    this.settingsStore.set('Settings', data, callback);
  }

  public subscribeSettingsSubject (): Subject<RequestSettingsType> {
    return this.settingsStore.getSubject();
  }

  public subscribeCurrentAccount (): Subject<CurrentAccountInfo> {
    return this.currentAccountStore.getSubject();
  }

  public getAccountAddress () {
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

  public getBalance (): BalanceJson {
    return { details: this.balanceMap } as BalanceJson;
  }

  public async getStoredBalance (address: string) {
    const items = await this.balanceStore.asyncGet(address);

    return items || {};
  }

  public async switchAccount (newAddress: string) {
    await Promise.all([
      this.resetBalanceMap(newAddress),
      this.resetCrowdloanMap(newAddress)
    ]);
  }

  public async resetBalanceMap (newAddress: string) {
    this.balanceMap = {};
    const defaultData = this.generateDefaultBalanceMap();
    const storedData = await this.getStoredBalance(newAddress);

    const merge = { ...defaultData, ...storedData } as Record<string, BalanceItem>;

    this.publishBalance(merge);
  }

  public async resetCrowdloanMap (newAddress: string) {
    this.crowdloanMap = {};
    const defaultData = generateDefaultCrowdloanMap();
    const storedData = await this.getStoredCrowdloan(newAddress);

    const merge = { ...defaultData, ...storedData } as Record<string, CrowdloanItem>;

    this.publishCrowdloan(merge);
  }

  public async resetStakingMap (newAddress: string) {
    this.stakingMap = {};
    const defaultData = generateDefaultStakingMap();
    const storedData = await this.getStoredStaking(newAddress);

    const merge = { ...defaultData, ...storedData } as Record<string, StakingItem>;

    this.publishStaking(merge);
  }

  public setBalanceItem (networkKey: string, item: BalanceItem) {
    const itemData = { timestamp: +new Date(), ...item };

    this.balanceMap[networkKey] = itemData;

    this.lazyNext('setBalanceItem', () => {
      this.updateBalanceStore();
      this.publishBalance(this.balanceMap);
    });
  }

  private updateBalanceStore () {
    const readyBalanceMap: Record<string, BalanceItem> = {};

    Object.entries(this.balanceMap).forEach(([key, balanceItem]) => {
      if (balanceItem.state === APIItemState.READY) {
        readyBalanceMap[key] = balanceItem;
      }
    });
    this.getCurrentAccount((currentAccountInfo) => {
      this.balanceStore.set(currentAccountInfo.address, readyBalanceMap);
    });
  }

  public subscribeBalance () {
    return this.balanceSubject;
  }

  public async fetchCrowdloanFundMap () {
    this.crowdloanFundMap = await fetchDotSamaCrowdloan();
  }

  public getCrowdloan (): CrowdloanJson {
    return { details: this.crowdloanMap } as CrowdloanJson;
  }

  public async getStoredCrowdloan (address: string) {
    const items = await this.crowdloanStore.asyncGet(address);

    return items || {};
  }

  public setCrowdloanItem (networkKey: string, item: CrowdloanItem) {
    const itemData = { ...item, timestamp: +new Date() };
    // Fill para state
    const crowdloanFundNode = this.crowdloanFundMap[networkKey];

    if (crowdloanFundNode) {
      itemData.paraState = convertFundStatus(crowdloanFundNode.status);
    }

    // Update crowdloan map
    this.crowdloanMap[networkKey] = itemData;

    this.lazyNext('setCrowdloanItem', () => {
      this.updateCrowdloanStore();
      this.publishCrowdloan(this.crowdloanMap);
    });
  }

  private updateCrowdloanStore () {
    const readyMap: Record<string, CrowdloanItem> = {};

    Object.entries(this.crowdloanMap).forEach(([key, item]) => {
      if (item.state === APIItemState.READY) {
        readyMap[key] = item;
      }
    });
    this.getCurrentAccount((currentAccountInfo) => {
      this.crowdloanStore.set(currentAccountInfo.address, readyMap);
    });
  }

  public subscribeCrowdloan () {
    return this.crowdloanSubject;
  }

  public getChainRegistryMap (): Record<string, ChainRegistry> {
    return this.chainRegistryMap;
  }

  public setChainRegistryItem (networkKey: string, registry: ChainRegistry) {
    this.chainRegistryMap[networkKey] = registry;
    this.lazyNext('setChainRegistry', () => {
      this.chainRegistrySubject.next(this.getChainRegistryMap());
    });
  }

  public checkTokenKey (tokenData: CustomEvmToken): string {
    const chainRegistry = this.chainRegistryMap[tokenData.chain];
    let tokenKey = '';

    for (const [key, token] of Object.entries(chainRegistry.tokenMap)) {
      if (token.erc20Address === tokenData.smartContract) {
        tokenKey = key;
        break;
      }
    }

    return tokenKey;
  }

  public upsertChainRegistry (tokenData: CustomEvmToken) {
    const chainRegistry = this.chainRegistryMap[tokenData.chain];
    const tokenKey = this.checkTokenKey(tokenData);

    if (tokenKey !== '') {
      chainRegistry.tokenMap[tokenKey] = {
        isMainToken: false,
        symbol: tokenData.symbol,
        name: tokenData.name,
        erc20Address: tokenData.smartContract,
        decimals: tokenData.decimals
      } as TokenInfo;
    } else {
      // @ts-ignore
      chainRegistry.tokenMap[tokenData.symbol] = {
        isMainToken: false,
        symbol: tokenData.symbol,
        name: tokenData.symbol,
        erc20Address: tokenData.smartContract,
        decimals: tokenData.decimals
      } as TokenInfo;
    }

    cacheRegistryMap[tokenData.chain] = chainRegistry;
    this.chainRegistrySubject.next(this.getChainRegistryMap());
  }

  public initChainRegistry () {
    this.chainRegistryMap = {};
    this.getEvmTokenStore((evmTokens) => {
      const erc20Tokens: CustomEvmToken[] = evmTokens ? evmTokens.erc20 : [];

      if (evmTokens) {
        evmTokens.erc20.forEach((token) => {
          if (!token.isDeleted) {
            erc20Tokens.push(token);
          }
        });
      }

      Object.entries(this.apiMap.dotSama).forEach(([networkKey, { api }]) => {
        getRegistry(networkKey, api, erc20Tokens)
          .then((rs) => {
            this.setChainRegistryItem(networkKey, rs);
          })
          .catch(console.error);
      });
    });

    Object.entries(this.apiMap.dotSama).forEach(([networkKey, { api }]) => {
      getRegistry(networkKey, api)
        .then((rs) => {
          this.setChainRegistryItem(networkKey, rs);
        })
        .catch(console.error);
    });
  }

  public subscribeChainRegistryMap () {
    return this.chainRegistrySubject;
  }

  public getTransactionHistory (address: string, networkKey: string, update: (items: TransactionHistoryItemType[]) => void): void {
    const items = this.historyMap[networkKey];

    if (!items) {
      update([]);
    } else {
      update(items);
    }
  }

  public subscribeHistory () {
    return this.historySubject;
  }

  public getHistoryMap (): Record<string, TransactionHistoryItemType[]> {
    return this.historyMap;
  }

  public setTransactionHistory (address: string, networkKey: string, item: TransactionHistoryItemType, callback?: (items: TransactionHistoryItemType[]) => void): void {
    this.getCurrentAccount((currentAccountInfo) => {
      if (currentAccountInfo.address === address) {
        const items = this.historyMap[networkKey] || [];

        item.origin = 'app';
        items.unshift(item);
        this.historyMap[networkKey] = items;
        // Save to storage
        this.saveHistoryToStorage(address);
        this.publishHistory(this.getHistoryMap());
        callback && callback(items);
      } else {
        this.transactionHistoryStore.asyncGet(address).then((data: Record<string, TransactionHistoryItemType[]>) => {
          const hash = this.getNetworkGenesisHashByKey(networkKey);
          const items = data[hash] || [];

          item.origin = 'app';
          items.unshift(item);
          data[hash] = items;
          this.transactionHistoryStore.set(address, data);
        }).catch((err) => console.warn(err));
      }
    });
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
        const activeNetworks: string[] = [];

        Object.values(this.networkMap).forEach((network) => {
          if (network.active && network.coinGeckoKey) {
            activeNetworks.push(network.coinGeckoKey);
          }
        });

        getTokenPrice(activeNetworks)
          .then((rs) => {
            this.setPrice(rs);
            update(rs);
          })
          .catch((err) => {
            console.error(err);
            throw err;
          });
      }
    });
  }

  public subscribePrice () {
    return this.priceStore.getSubject();
  }

  public subscribeEvmToken () {
    return this.evmTokenSubject;
  }

  public getEvmTokenState () {
    return this.evmTokenState;
  }

  public getActiveErc20Tokens () {
    const filteredErc20Tokens: CustomEvmToken[] = [];

    this.evmTokenState.erc20.forEach((token) => {
      if (!token.isDeleted) {
        filteredErc20Tokens.push(token);
      }
    });

    return filteredErc20Tokens;
  }

  public getActiveErc721Tokens () {
    const filteredErc721Tokens: CustomEvmToken[] = [];

    this.evmTokenState.erc721.forEach((token) => {
      if (!token.isDeleted) {
        filteredErc721Tokens.push(token);
      }
    });

    return filteredErc721Tokens;
  }

  public getEvmTokenStore (callback: (data: EvmTokenJson) => void) {
    return this.customEvmTokenStore.get('EvmToken', (data) => {
      callback(data);
    });
  }

  public upsertEvmToken (data: CustomEvmToken) {
    let isExist = false;

    for (const token of this.evmTokenState[data.type]) {
      if (token.smartContract === data.smartContract && token.type === data.type && token.chain === data.chain) {
        isExist = true;
        break;
      }
    }

    if (!isExist) {
      this.evmTokenState[data.type].push(data);
    } else {
      this.evmTokenState[data.type] = this.evmTokenState[data.type].map((token) => {
        if (token.smartContract === data.smartContract) {
          return data;
        }

        return token;
      });
    }

    if (data.type === 'erc20') {
      this.upsertChainRegistry(data);
    }

    this.evmTokenSubject.next(this.evmTokenState);
    this.customEvmTokenStore.set('EvmToken', this.evmTokenState);
    this.updateServiceInfo();
  }

  public deleteEvmTokens (targetTokens: DeleteEvmTokenParams[]) {
    const _evmTokenState: EvmTokenJson = this.evmTokenState;
    let needUpdateChainRegistry = false;

    for (const targetToken of targetTokens) {
      for (let index = 0; index < _evmTokenState.erc20.length; index++) {
        if (_evmTokenState.erc20[index].smartContract === targetToken.smartContract && _evmTokenState.erc20[index].chain === targetToken.chain && targetToken.type === 'erc20') {
          if (_evmTokenState.erc20[index].isCustom) {
            _evmTokenState.erc20.splice(index, 1);
          } else {
            _evmTokenState.erc20[index].isDeleted = true;
          }

          needUpdateChainRegistry = true;
        }
      }
    }

    if (needUpdateChainRegistry) {
      for (const targetToken of targetTokens) {
        const chainRegistry = this.chainRegistryMap[targetToken.chain];
        let deleteKey = '';

        for (const [key, token] of Object.entries(chainRegistry.tokenMap)) {
          if (token.erc20Address === targetToken.smartContract && targetToken.type === 'erc20') {
            deleteKey = key;
          }
        }

        delete chainRegistry.tokenMap[deleteKey];
        this.chainRegistryMap[targetToken.chain] = chainRegistry;
        cacheRegistryMap[targetToken.chain] = chainRegistry;
      }
    }

    for (const targetToken of targetTokens) {
      for (let index = 0; index < _evmTokenState.erc721.length; index++) {
        if (_evmTokenState.erc721[index].smartContract === targetToken.smartContract && _evmTokenState.erc721[index].chain === targetToken.chain && targetToken.type === 'erc721') {
          if (_evmTokenState.erc721[index].isCustom) {
            _evmTokenState.erc721.splice(index, 1);
          } else {
            _evmTokenState.erc721[index].isDeleted = true;
          }
        }
      }
    }

    this.evmTokenState = _evmTokenState;
    this.evmTokenSubject.next(this.evmTokenState);
    this.chainRegistrySubject.next(this.getChainRegistryMap());
    this.customEvmTokenStore.set('EvmToken', this.evmTokenState);
    this.updateServiceInfo();
  }

  public getNetworkMap () {
    return this.networkMap;
  }

  public getNetworkMapByKey (key: string) {
    return this.networkMap[key];
  }

  public subscribeNetworkMap () {
    return this.networkMapStore.getSubject();
  }

  public async upsertNetworkMap (data: NetworkJson): Promise<boolean> {
    if (this.lockNetworkMap) {
      return false;
    }

    this.lockNetworkMap = true;

    if (data.key in this.networkMap) { // update provider for existed network
      if (data.customProviders) {
        this.networkMap[data.key].customProviders = data.customProviders;
      }

      if (data.currentProvider !== this.networkMap[data.key].currentProvider) {
        this.networkMap[data.key].currentProvider = data.currentProvider;
        this.networkMap[data.key].currentProviderMode = data.currentProvider.startsWith('ws') ? 'ws' : 'http';
      }

      this.networkMap[data.key].chain = data.chain;

      if (data.nativeToken) {
        this.networkMap[data.key].nativeToken = data.nativeToken;
      }

      if (data.decimals) {
        this.networkMap[data.key].decimals = data.decimals;
      }

      this.networkMap[data.key].crowdloanUrl = data.crowdloanUrl;

      this.networkMap[data.key].coinGeckoKey = data.coinGeckoKey;

      this.networkMap[data.key].paraId = data.paraId;

      this.networkMap[data.key].blockExplorer = data.blockExplorer;
    } else { // insert
      this.networkMap[data.key] = data;
      this.networkMap[data.key].getStakingOnChain = true; // try to fetch staking on chain for custom network by default
    }

    if (this.networkMap[data.key].active) { // update API map if network is active
      if (data.key in this.apiMap.dotSama) {
        await this.apiMap.dotSama[data.key].api.disconnect();
        delete this.apiMap.dotSama[data.key];
      }

      if (data.isEthereum && data.key in this.apiMap.web3) {
        delete this.apiMap.web3[data.key];
      }

      this.apiMap.dotSama[data.key] = initApi(data.key, getCurrentProvider(data), data.isEthereum);

      if (data.isEthereum && data.isEthereum) {
        this.apiMap.web3[data.key] = initWeb3Api(getCurrentProvider(data));
      }
    }

    this.networkMapSubject.next(this.networkMap);
    this.networkMapStore.set('NetworkMap', this.networkMap);
    this.updateServiceInfo();
    this.lockNetworkMap = false;

    return true;
  }

  public removeNetworkMap (networkKey: string): boolean {
    if (this.lockNetworkMap) {
      return false;
    }

    this.lockNetworkMap = true;
    delete this.networkMap[networkKey];

    this.networkMapSubject.next(this.networkMap);
    this.networkMapStore.set('NetworkMap', this.networkMap);
    this.updateServiceInfo();
    this.lockNetworkMap = false;

    return true;
  }

  public async disableNetworkMap (networkKey: string): Promise<boolean> {
    if (this.lockNetworkMap) {
      return false;
    }

    this.lockNetworkMap = true;
    await this.apiMap.dotSama[networkKey]?.api.disconnect();
    delete this.apiMap.dotSama[networkKey];

    if (this.networkMap[networkKey].isEthereum && this.networkMap[networkKey].isEthereum) {
      delete this.apiMap.web3[networkKey];
    }

    this.networkMap[networkKey].active = false;
    this.networkMap[networkKey].apiStatus = NETWORK_STATUS.DISCONNECTED;
    this.networkMapSubject.next(this.networkMap);
    this.networkMapStore.set('NetworkMap', this.networkMap);
    this.updateServiceInfo();
    this.lockNetworkMap = false;

    if (this.networkMap[networkKey].isEthereum) {
      this.getAuthorize((data) => {
        this.evmChainSubject.next(data);
      });
    }

    return true;
  }

  public async disableAllNetworks (): Promise<boolean> {
    if (this.lockNetworkMap) {
      return false;
    }

    this.lockNetworkMap = true;
    const targetNetworkKeys: string[] = [];

    for (const [key, network] of Object.entries(this.networkMap)) {
      if (network.active && key !== 'polkadot' && key !== 'kusama') {
        targetNetworkKeys.push(key);
        this.networkMap[key].active = false;
      }
    }

    this.networkMapSubject.next(this.networkMap);
    this.networkMapStore.set('NetworkMap', this.networkMap);

    for (const key of targetNetworkKeys) {
      await this.apiMap.dotSama[key].api.disconnect();
      delete this.apiMap.dotSama[key];

      if (this.networkMap[key].isEthereum && this.networkMap[key].isEthereum) {
        delete this.apiMap.web3[key];
      }

      this.networkMap[key].apiStatus = NETWORK_STATUS.DISCONNECTED;
    }

    this.updateServiceInfo();
    this.lockNetworkMap = false;

    this.getAuthorize((data) => {
      this.evmChainSubject.next(data);
    });

    return true;
  }

  public enableNetworkMap (networkKey: string) {
    if (this.lockNetworkMap) {
      return false;
    }

    this.lockNetworkMap = true;
    this.apiMap.dotSama[networkKey] = initApi(networkKey, getCurrentProvider(this.networkMap[networkKey]), this.networkMap[networkKey].isEthereum);

    if (this.networkMap[networkKey].isEthereum && this.networkMap[networkKey].isEthereum) {
      this.apiMap.web3[networkKey] = initWeb3Api(getCurrentProvider(this.networkMap[networkKey]));
    }

    this.networkMap[networkKey].active = true;
    this.networkMapSubject.next(this.networkMap);
    this.networkMapStore.set('NetworkMap', this.networkMap);
    this.updateServiceInfo();
    this.lockNetworkMap = false;

    if (this.networkMap[networkKey].isEthereum) {
      this.getAuthorize((data) => {
        this.evmChainSubject.next(data);
      });
    }

    return true;
  }

  public enableAllNetworks () {
    if (this.lockNetworkMap) {
      return false;
    }

    this.lockNetworkMap = true;
    const targetNetworkKeys: string[] = [];

    for (const [key, network] of Object.entries(this.networkMap)) {
      if (!network.active) {
        targetNetworkKeys.push(key);
        this.networkMap[key].active = true;
      }
    }

    this.networkMapSubject.next(this.networkMap);
    this.networkMapStore.set('NetworkMap', this.networkMap);

    for (const key of targetNetworkKeys) {
      this.apiMap.dotSama[key] = initApi(key, getCurrentProvider(this.networkMap[key]), this.networkMap[key].isEthereum);

      if (this.networkMap[key].isEthereum && this.networkMap[key].isEthereum) {
        this.apiMap.web3[key] = initWeb3Api(getCurrentProvider(this.networkMap[key]));
      }
    }

    this.updateServiceInfo();
    this.lockNetworkMap = false;

    this.getAuthorize((data) => {
      this.evmChainSubject.next(data);
    });

    return true;
  }

  public async resetDefaultNetwork () {
    if (this.lockNetworkMap) {
      return false;
    }

    this.lockNetworkMap = true;
    const targetNetworkKeys: string[] = [];

    for (const [key, network] of Object.entries(this.networkMap)) {
      if (!network.active) {
        if (key === 'polkadot' || key === 'kusama') {
          this.apiMap.dotSama[key] = initApi(key, getCurrentProvider(this.networkMap[key]), this.networkMap[key].isEthereum);
          this.networkMap[key].active = true;
        }
      } else {
        if (key !== 'polkadot' && key !== 'kusama') {
          targetNetworkKeys.push(key);

          this.networkMap[key].active = false;
          this.networkMap[key].apiStatus = NETWORK_STATUS.DISCONNECTED;
        }
      }
    }

    this.networkMapSubject.next(this.networkMap);
    this.networkMapStore.set('NetworkMap', this.networkMap);

    for (const key of targetNetworkKeys) {
      await this.apiMap.dotSama[key].api.disconnect();
      delete this.apiMap.dotSama[key];

      if (this.networkMap[key].isEthereum && this.networkMap[key].isEthereum) {
        delete this.apiMap.web3[key];
      }
    }

    this.updateServiceInfo();
    this.lockNetworkMap = false;

    return true;
  }

  public updateNetworkStatus (networkKey: string, status: NETWORK_STATUS) {
    this.networkMap[networkKey].apiStatus = status;

    this.networkMapSubject.next(this.networkMap);
    this.networkMapStore.set('NetworkMap', this.networkMap);
  }

  public getDotSamaApiMap () {
    return this.apiMap.dotSama;
  }

  public getDotSamaApi (networkKey: string) {
    return this.apiMap.dotSama[networkKey];
  }

  public getWeb3ApiMap (): Record<string, Web3> {
    return this.apiMap.web3;
  }

  public getApiMap () {
    return this.apiMap;
  }

  public refreshDotSamaApi (key: string) {
    const apiProps = this.apiMap.dotSama[key];

    if (key in this.apiMap.dotSama) {
      if (!apiProps.isApiConnected) {
        apiProps.recoverConnect && apiProps.recoverConnect();
      }
    }

    return true;
  }

  public refreshWeb3Api (key: string) {
    this.apiMap.web3[key] = initWeb3Api(getCurrentProvider(this.networkMap[key]));
  }

  public subscribeServiceInfo () {
    return this.serviceInfoSubject;
  }

  public updateServiceInfo () {
    console.log('<---Update serviceInfo--->');
    this.getCurrentAccount((value) => {
      this.serviceInfoSubject.next({
        networkMap: this.networkMap,
        apiMap: this.apiMap,
        currentAccountInfo: value,
        chainRegistry: this.chainRegistryMap,
        customErc721Registry: this.getActiveErc721Tokens()
      });
    });
  }

  public getNetworkGenesisHashByKey (key: string) {
    const network = this.networkMap[key];

    return network && network.genesisHash;
  }

  public getNetworkKeyByGenesisHash (hash: string) {
    return Object.values(this.networkMap).find((network) => network.genesisHash === hash)?.key;
  }

  public async resetHistoryMap (newAddress: string): Promise<void> {
    this.historyMap = {};

    const storedData = await this.getStoredHistories(newAddress);

    if (storedData) {
      this.historyMap = storedData;
    }

    this.publishHistory(this.getHistoryMap());
  }

  public async getStoredHistories (address: string) {
    if (Object.keys(this.networkMap).length === 0) {
      return;
    }

    const data = await this.transactionHistoryStore.asyncGet(address);

    if (data) {
      return this.convertHashKeyToNetworkKey(data);
    }

    return undefined;
  }

  private saveHistoryToStorage (address: string) {
    if (Object.keys(this.networkMap).length === 0) {
      return;
    }

    const newestHistoryMap = this.convertNetworkKeyToHashKey(this.historyMap);

    Object.entries(newestHistoryMap).forEach(([key, items]) => {
      if (!Array.isArray(items) || !items.length) {
        delete newestHistoryMap[key];
      }
    });

    this.transactionHistoryStore.set(address, newestHistoryMap);
  }

  private convertNetworkKeyToHashKey<T> (object: Record<string, T> = {}) {
    return Object.entries(object).reduce((newObj: Record<string, T>, [key, data]) => {
      const hash = this.getNetworkGenesisHashByKey(key);

      if (hash) {
        newObj[hash] = data;
      }

      return newObj;
    }, {});
  }

  private convertHashKeyToNetworkKey<T> (object: Record<string, T> = {}) {
    return Object.entries(object).reduce((newObj: Record<string, T>, [hash, data]) => {
      const key = this.getNetworkKeyByGenesisHash(hash);

      if (key) {
        newObj[key] = data;
      }

      return newObj;
    }, {});
  }

  private combineHistories (oldItems: TransactionHistoryItemType[], newItems: TransactionHistoryItemType[]): TransactionHistoryItemType[] {
    const newHistories = newItems.filter((item) => !oldItems.some((old) => this.isSameHistory(old, item)));

    return [...oldItems, ...newHistories].filter((his) => his.origin === 'app' || his.eventIdx).sort((a, b) => b.time - a.time);
  }

  public isSameHistory (oldItem: TransactionHistoryItemType, newItem: TransactionHistoryItemType): boolean {
    if (oldItem.extrinsicHash === newItem.extrinsicHash) {
      if (oldItem.origin === 'app') {
        return true;
      } else {
        return oldItem.eventIdx === newItem.eventIdx;
      }
    }

    return false;
  }

  public pauseAllNetworks (code?: number, reason?: string) {
    // Disconnect web3 networks
    Object.entries(this.apiMap.web3).forEach(([key, network]) => {
      if (network.currentProvider instanceof Web3.providers.WebsocketProvider) {
        if (network.currentProvider?.connected) {
          console.log(`[Web3] ${key} is conected`);
          network.currentProvider?.disconnect(code, reason);
          console.log(`[Web3] ${key} is ${network.currentProvider.connected ? 'connected' : 'disconnected'} now`);
        }
      }
    });

    // Disconnect dotsama networks
    return Promise.all(Object.values(this.apiMap.dotSama).map(async (network) => {
      if (network.api.isConnected) {
        console.log(`[Dotsama] Stopping network [${network.specName}]`);
        await network.api.disconnect();
      }
    }));
  }

  async resumeAllNetworks () {
    // Reconnect web3 networks
    Object.entries(this.apiMap.web3).forEach(([key, network]) => {
      const currentProvider = network.currentProvider;

      if (currentProvider instanceof Web3.providers.WebsocketProvider) {
        if (!currentProvider.connected) {
          console.log(`[Web3] ${key} is disconected`);
          currentProvider?.connect();
          setTimeout(() => console.log(`[Web3] ${key} is ${currentProvider.connected ? 'connected' : 'disconnected'} now`), 500);
        }
      }
    });

    // Reconnect dotsama networks
    return Promise.all(Object.values(this.apiMap.dotSama).map(async (network) => {
      if (!network.api.isConnected) {
        console.log(`[Dotsama] Resumming network [${network.specName}]`);
        await network.api.connect();
      }
    }));
  }

  private isSameNft (originNft: NftItem, destinationNft: NftItem) {
    return originNft.chain === destinationNft.chain &&
      originNft.collectionId === destinationNft.collectionId &&
      originNft.id === destinationNft.id;
  }

  private publishBalance (data: Record<string, BalanceItem>) {
    const activeData = this.removeInactiveNetworkData(data);

    this.balanceSubject.next({ details: activeData });
  }

  private publishCrowdloan (data: Record<string, CrowdloanItem>) {
    const activeData = this.removeInactiveNetworkData(data);

    this.crowdloanSubject.next({ details: activeData });
  }

  private publishStaking (data: Record<string, StakingItem>) {
    const activeData = this.removeInactiveNetworkData(data);

    this.stakingSubject.next({ ready: false, details: activeData });
  }

  private publishHistory (data: Record<string, TransactionHistoryItemType[]>) {
    const activeData = this.removeInactiveNetworkData(data);

    this.historySubject.next(activeData);
  }

  private removeInactiveNetworkData<T> (data: Record<string, T>) {
    const activeData: Record<string, T> = {};

    Object.entries(data).forEach(([networkKey, items]) => {
      if (this.networkMap[networkKey]?.active) {
        activeData[networkKey] = items;
      }
    });

    return activeData;
  }

  findNetworkKeyByGenesisHash (genesisHash?: string | null): [string | undefined, NetworkJson | undefined] {
    if (!genesisHash) {
      return [undefined, undefined];
    }

    const rs = Object.entries(this.networkMap).find(([networkKey, value]) => (value.genesisHash === genesisHash));

    if (rs) {
      return rs;
    } else {
      return [undefined, undefined];
    }
  }

  findChainIdGenesisHash (genesisHash?: string | null): number | undefined {
    return this.findNetworkKeyByGenesisHash(genesisHash)[1]?.evmChainId;
  }

  findNetworkKeyByChainId (chainId?: number | null): [string | undefined, NetworkJson | undefined] {
    if (!chainId) {
      return [undefined, undefined];
    }

    const rs = Object.entries(this.networkMap).find(([networkKey, value]) => (value.evmChainId === chainId));

    if (rs) {
      return rs;
    } else {
      return [undefined, undefined];
    }
  }

  public accountExportPrivateKey ({ address, password }: RequestAccountExportPrivateKey): ResponseAccountExportPrivateKey {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const exportedJson = keyring.backupAccount(keyring.getPair(address), password);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const decoded = decodePair(password, base64Decode(exportedJson.encoded), exportedJson.encoding.type);

    return {
      privateKey: u8aToHex(decoded.secretKey)
    };
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

    const requiredPassword = true;
    let privateKey = '';

    const validateConfirmationResponsePayload = (result: ConfirmationDefinitions['evmSignatureRequest'][1]) => {
      if (result.isApproved) {
        if (requiredPassword && !result?.password) {
          return Error('Password is required');
        }

        privateKey = (result?.password && this.accountExportPrivateKey({ address: address, password: result.password }).privateKey) || '';

        if (privateKey === '') {
          return Error('Cannot export private key');
        }
      }

      return undefined;
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const signPayload = { address, type: method, payload };

    await this.addConfirmation(id, url, 'evmSignatureRequest', signPayload, { requiredPassword: true, address }, validateConfirmationResponsePayload)
      .then(({ isApproved, password }) => {
        if (isApproved && password) {
          return password;
        }

        throw new EvmRpcError('USER_REJECTED_REQUEST');
      });

    if (privateKey === '') {
      throw Error('Cannot export private key');
    }

    const simpleKeyring = new SimpleKeyring([privateKey]);

    switch (method) {
      case 'eth_sign':
        return await simpleKeyring.signMessage(address, payload as string);
      case 'personal_sign':
        return await simpleKeyring.signPersonalMessage(address, payload as string);
      case 'eth_signTypedData':
        return await simpleKeyring.signTypedData(address, payload as any[]);
      case 'eth_signTypedData_v1':
        return await simpleKeyring.signTypedData_v1(address, payload as any[]);
      case 'eth_signTypedData_v3':
        return await simpleKeyring.signTypedData_v3(address, payload);
      case 'eth_signTypedData_v4':
        return await simpleKeyring.signTypedData_v4(address, payload);
      default:
        throw new EvmRpcError('INVALID_PARAMS', 'Not found sign method');
    }
  }

  public async evmSendTransaction (id: string, url: string, networkKey: string, allowedAccounts: string[], transactionParams: EvmSendTransactionParams): Promise<string | undefined> {
    const web3 = this.getWeb3ApiMap()[networkKey];

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

    // Validate balance
    const balance = new BN(await web3.eth.getBalance(fromAddress) || 0);

    if (balance.lt(new BN(gasPrice.toString()).mul(new BN(transaction.gas)).add(new BN(autoFormatNumber(transactionParams.value) || '0')))) {
      throw new EvmRpcError('INVALID_PARAMS', 'Balance can be not enough to send transaction');
    }

    const requiredPassword = true; // password is always required for to export private, we have planning to save password 15 min like sign keypair.isLocked;

    let privateKey = '';

    const validateConfirmationResponsePayload = (result: ConfirmationDefinitions['evmSendTransactionRequest'][1]) => {
      if (result.isApproved) {
        if (requiredPassword && !result?.password) {
          return Error('Password is required');
        }

        privateKey = (result?.password && this.accountExportPrivateKey({ address: fromAddress, password: result.password }).privateKey) || '';

        if (privateKey === '') {
          return Error('Cannot export private key');
        }
      }

      return undefined;
    };

    const requestPayload = { ...transaction, estimateGas };

    const setTransactionHistory = (receipt: TransactionReceipt) => {
      const network = this.getNetworkMapByKey(networkKey);

      this.setTransactionHistory(fromAddress, networkKey, {
        isSuccess: true,
        time: Date.now(),
        networkKey,
        change: transaction.value?.toString() || '0',
        changeSymbol: undefined,
        fee: receipt.effectiveGasPrice.toString(),
        feeSymbol: network?.nativeToken,
        action: 'send',
        extrinsicHash: receipt.transactionHash
      });
    };

    const setFailedHistory = (transactionHash: string) => {
      const network = this.getNetworkMapByKey(networkKey);

      this.setTransactionHistory(fromAddress, networkKey, {
        isSuccess: false,
        time: Date.now(),
        networkKey,
        change: transaction.value?.toString() || '0',
        changeSymbol: undefined,
        fee: undefined,
        feeSymbol: network?.nativeToken,
        action: 'send',
        extrinsicHash: transactionHash
      });
    };

    return this.addConfirmation(id, url, 'evmSendTransactionRequest', requestPayload, { requiredPassword: true, address: fromAddress, networkKey }, validateConfirmationResponsePayload)
      .then(async ({ isApproved }) => {
        if (isApproved) {
          const signTransaction = await web3.eth.accounts.signTransaction(transaction, privateKey);
          let transactionHash = '';

          return new Promise<string>((resolve, reject) => {
            signTransaction.rawTransaction && web3.eth.sendSignedTransaction(signTransaction.rawTransaction)
              .once('transactionHash', (hash) => {
                transactionHash = hash;
                resolve(hash);
              })
              .once('receipt', setTransactionHistory)
              .once('error', (e) => {
                setFailedHistory(transactionHash);
                reject(e);
              });
          });
        } else {
          return Promise.reject(new EvmRpcError('USER_REJECTED_REQUEST'));
        }
      });
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
        console.error('Not found confirmation', type, id);
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
      } else if (type === 'evmSendTransactionRequest') {
        _completeConfirmation(type, result as ConfirmationDefinitions['evmSendTransactionRequest'][1]);
      }
    });

    return true;
  }
}
