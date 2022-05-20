// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { withErrorLog } from '@subwallet/extension-base/background/handlers/helpers';
import State, { AuthUrls, Resolver } from '@subwallet/extension-base/background/handlers/State';
import { AccountRefMap, APIItemState, ApiMap, AuthRequestV2, BalanceItem, BalanceJson, ChainRegistry, CrowdloanItem, CrowdloanJson, CurrentAccountInfo, CustomEvmToken, DeleteEvmTokenParams, EvmTokenJson, NETWORK_STATUS, NetworkJson, NftCollection, NftCollectionJson, NftItem, NftJson, NftTransferExtra, PriceJson, RequestSettingsType, ResultResolver, ServiceInfo, StakingItem, StakingJson, StakingRewardJson, TokenInfo, TransactionHistoryItemType } from '@subwallet/extension-base/background/KoniTypes';
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
import { CurrentAccountStore, NetworkMapStore, PriceStore } from '@subwallet/extension-koni-base/stores';
import AccountRefStore from '@subwallet/extension-koni-base/stores/AccountRef';
import AuthorizeStore from '@subwallet/extension-koni-base/stores/Authorize';
import CustomEvmTokenStore from '@subwallet/extension-koni-base/stores/CustomEvmToken';
import SettingsStore from '@subwallet/extension-koni-base/stores/Settings';
import TransactionHistoryStore from '@subwallet/extension-koni-base/stores/TransactionHistory';
import { convertFundStatus, getCurrentProvider } from '@subwallet/extension-koni-base/utils/utils';
import { BehaviorSubject, Subject } from 'rxjs';

import { accounts } from '@polkadot/ui-keyring/observable/accounts';
import { assert } from '@polkadot/util';

function generateDefaultBalanceMap () {
  const balanceMap: Record<string, BalanceItem> = {};

  Object.keys(PREDEFINED_NETWORKS).forEach((networkKey) => {
    balanceMap[networkKey] = {
      state: APIItemState.PENDING,
      free: '0',
      reserved: '0',
      miscFrozen: '0',
      feeFrozen: '0'
    };
  });

  return balanceMap;
}

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

export function mergeNetworkProviders (customNetwork: NetworkJson, predefinedNetwork: NetworkJson) { // merge providers for 2 networks with the same genesisHash
  if (customNetwork.customProviders) {
    const parsedCustomProviders: Record<string, string> = {};
    const currentProvider = customNetwork.customProviders[customNetwork.currentProvider];
    const currentProviderMethod = currentProvider.startsWith('http') ? 'http' : 'ws';
    let parsedProviderKey = '';

    for (const customProvider of Object.values(customNetwork.customProviders)) {
      let exist = false;

      for (const [key, provider] of Object.entries(predefinedNetwork.providers)) {
        if (currentProvider === provider) { // point currentProvider to predefined
          parsedProviderKey = key;
        }

        if (provider === customProvider) {
          exist = true;
          break;
        }
      }

      if (!exist) {
        const index = Object.values(parsedCustomProviders).length;

        parsedCustomProviders[`custom_${index}`] = customProvider;
      }
    }

    for (const [key, parsedProvider] of Object.entries(parsedCustomProviders)) {
      if (currentProvider === parsedProvider) {
        parsedProviderKey = key;
      }
    }

    return { currentProviderMethod, parsedProviderKey, parsedCustomProviders };
  } else {
    return { currentProviderMethod: '', parsedProviderKey: '', parsedCustomProviders: {} };
  }
}

export default class KoniState extends State {
  public readonly authSubjectV2: BehaviorSubject<AuthorizeRequest[]> = new BehaviorSubject<AuthorizeRequest[]>([]);

  private readonly networkMapStore = new NetworkMapStore(); // persist custom networkMap by user
  private readonly customEvmTokenStore = new CustomEvmTokenStore();
  private readonly priceStore = new PriceStore();
  private readonly currentAccountStore = new CurrentAccountStore();
  private readonly settingsStore = new SettingsStore();
  private readonly accountRefStore = new AccountRefStore();
  private readonly authorizeStore = new AuthorizeStore();
  readonly #authRequestsV2: Record<string, AuthRequestV2> = {};
  private priceStoreReady = false;
  private readonly transactionHistoryStore = new TransactionHistoryStore();

  // init networkMap, apiMap and chainRegistry (first time only)
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
            }

            mergedNetworkMap[key].active = storedNetwork.active;
            mergedNetworkMap[key].currentProvider = storedNetwork.currentProvider;
            mergedNetworkMap[key].currentProviderMode = mergedNetworkMap[key].currentProvider.startsWith('http') ? 'http' : 'ws';
          } else {
            if (Object.keys(PREDEFINED_GENESIS_HASHES).includes(storedNetwork.genesisHash)) { // merge networks with same genesis hash
              // @ts-ignore
              const targetKey = PREDEFINED_GENESIS_HASHES[storedNetwork.genesisHash] as string;

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

      this.initChainRegistry();
      this.initEvmTokenState();
    });
  }

  private networkMap: Record<string, NetworkJson> = {}; // mapping to networkMapStore, for uses in background
  private networkMapSubject = new Subject<Record<string, NetworkJson>>();

  private apiMap: ApiMap = { dotSama: {}, web3: {} };

  private serviceInfoSubject = new Subject<ServiceInfo>();

  public initEvmTokenState () {
    this.customEvmTokenStore.get('EvmToken', (storedEvmTokens) => {
      if (!storedEvmTokens) {
        this.evmTokenState = DEFAULT_EVM_TOKENS;
      } else {
        const _evmTokenState = DEFAULT_EVM_TOKENS;

        for (const storedToken of storedEvmTokens.erc20) {
          let exist = false;

          for (const defaultToken of DEFAULT_EVM_TOKENS.erc20) {
            if (defaultToken.smartContract === storedToken.smartContract && defaultToken.chain === storedToken.chain) {
              exist = true;
              break;
            }
          }

          if (!exist) {
            _evmTokenState.erc20.push(storedToken);
          }
        }

        for (const storedToken of storedEvmTokens.erc721) {
          let exist = false;

          for (const defaultToken of DEFAULT_EVM_TOKENS.erc721) {
            if (defaultToken.smartContract === storedToken.smartContract && defaultToken.chain === storedToken.chain) {
              exist = true;
              break;
            }
          }

          if (!exist) {
            _evmTokenState.erc721.push(storedToken);
          }
        }

        this.evmTokenState = _evmTokenState;
      }

      this.customEvmTokenStore.set('EvmToken', this.evmTokenState);
      this.evmTokenSubject.next(this.evmTokenState);
    });
  }

  private evmTokenState: EvmTokenJson = { erc20: [], erc721: [] };
  private evmTokenSubject = new Subject<EvmTokenJson>();
  private balanceMap: Record<string, BalanceItem> = generateDefaultBalanceMap();
  private balanceSubject = new Subject<BalanceJson>();
  private nftState: NftJson = {
    total: 0,
    nftList: []
  };

  private nftCollectionState: NftCollectionJson = {
    ready: false,
    nftCollectionList: []
  };

  // Only for rendering nft after transfer
  private nftTransferState: NftTransferExtra = {
    cronUpdate: false,
    forceUpdate: false
  };

  private stakingMap: Record<string, StakingItem> = generateDefaultStakingMap();
  private stakingRewardState: StakingRewardJson = {
    ready: false,
    details: []
  } as StakingRewardJson;

  // eslint-disable-next-line camelcase
  private crowdloanFundmap: Record<string, DotSamaCrowdloan_crowdloans_nodes> = {};
  private crowdloanMap: Record<string, CrowdloanItem> = generateDefaultCrowdloanMap();
  private crowdloanSubject = new Subject<CrowdloanJson>();
  private nftTransferSubject = new Subject<NftTransferExtra>();
  private nftSubject = new Subject<NftJson>();
  private nftCollectionSubject = new Subject<NftCollectionJson>();
  private stakingSubject = new Subject<StakingJson>();
  private stakingRewardSubject = new Subject<StakingRewardJson>();
  private historyMap: Record<string, TransactionHistoryItemType[]> = {};
  private historySubject = new Subject<Record<string, TransactionHistoryItemType[]>>();

  // Todo: persist data to store later
  private chainRegistryMap: Record<string, ChainRegistry> = {};
  private chainRegistrySubject = new Subject<Record<string, ChainRegistry>>();

  private lazyMap: Record<string, unknown> = {};

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
    this.authorizeStore.set('authUrls', data, callback);
  }

  public getAuthorize (update: (value: AuthUrls) => void): void {
    this.authorizeStore.get('authUrls', update);
  }

  private updateIconV2 (shouldClose?: boolean): void {
    const authCount = this.numAuthRequestsV2;
    const text = (
      authCount
        ? 'Auth'
        : ''
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
    const addressList = Object.keys(accounts.subject.value)
      .filter((address) => accounts.subject.value[address].type !== 'ethereum');
    const addressListMap = addressList.reduce((addressList, v) => ({ ...addressList, [v]: value }), {});

    return addressListMap;
  }

  private updateIconAuthV2 (shouldClose?: boolean): void {
    this.authSubjectV2.next(this.allAuthRequestsV2);
    this.updateIconV2(shouldClose);
  }

  private authCompleteV2 = (id: string, resolve: (result: boolean) => void, reject: (error: Error) => void): Resolver<ResultResolver> => {
    const isAllowedMap = this.getAddressList();

    const complete = (result: boolean | Error, accounts?: string[]) => {
      const isAllowed = result === true;

      if (accounts && accounts.length) {
        accounts.forEach((acc) => {
          isAllowedMap[acc] = true;
        });
      } else {
        // eslint-disable-next-line no-return-assign
        Object.keys(isAllowedMap).forEach((address) => isAllowedMap[address] = false);
      }

      const { idStr, request: { origin }, url } = this.#authRequestsV2[id];

      this.getAuthorize((value) => {
        let authorizeList = {} as AuthUrls;

        if (value) {
          authorizeList = value;
        }

        authorizeList[this.stripUrl(url)] = {
          count: 0,
          id: idStr,
          isAllowed,
          isAllowedMap,
          origin,
          url
        };

        this.setAuthorize(authorizeList);
        delete this.#authRequestsV2[id];
        this.updateIconAuthV2(true);
      });
    };

    return {
      reject: (error: Error): void => {
        complete(error);
        reject(error);
      },
      resolve: ({ accounts, result }: ResultResolver): void => {
        complete(result, accounts);
        resolve(result);
      }
    };
  };

  public async authorizeUrlV2 (url: string, request: RequestAuthorizeTab): Promise<boolean> {
    const idStr = this.stripUrl(url);
    // Do not enqueue duplicate authorization requests.
    const isDuplicate = Object.values(this.#authRequestsV2)
      .some((request) => request.idStr === idStr);

    assert(!isDuplicate, `The source ${url} has a pending authorization request`);

    let authList = await this.getAuthList();

    if (!authList) {
      authList = {};
    }

    if (authList[idStr]) {
      // this url was seen in the past
      const isConnected = Object.keys(authList[idStr].isAllowedMap)
        .some((address) => authList[idStr].isAllowedMap[address]);

      assert(isConnected, `The source ${url} is not allowed to interact with this extension`);

      return false;
    }

    return new Promise((resolve, reject): void => {
      const id = getId();

      this.#authRequestsV2[id] = {
        ...this.authCompleteV2(id, resolve, reject),
        id,
        idStr,
        request,
        url
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

  public subscribeStaking () {
    return this.stakingSubject;
  }

  public ensureUrlAuthorizedV2 (url: string): boolean {
    const idStr = this.stripUrl(url);

    this.getAuthorize((value) => {
      if (!value) {
        value = {};
      }

      const isConnected = Object.keys(value[idStr].isAllowedMap)
        .some((address) => value[idStr].isAllowedMap[address]);
      const entry = Object.keys(value).includes(idStr);

      assert(entry, `The source ${url} has not been enabled yet`);
      assert(isConnected, `The source ${url} is not allowed to interact with this extension`);
    });

    return true;
  }

  public setStakingItem (networkKey: string, item: StakingItem): void {
    this.stakingMap[networkKey] = item;
    this.lazyNext('setStakingItem', () => {
      this.stakingSubject.next(this.getStaking());
    });
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

  public setNftCollection (data: NftCollectionJson, callback?: (data: NftCollectionJson) => void): void {
    this.nftCollectionState = data;

    if (callback) {
      callback(data);
    }

    this.nftCollectionSubject.next(this.nftCollectionState);
  }

  public updateNftCollection (data: NftCollection, callback?: (data: NftCollection) => void): void {
    this.nftCollectionState.nftCollectionList.push(data);

    if (callback) {
      callback(data);
    }

    this.nftCollectionSubject.next(this.nftCollectionState);
  }

  public updateNftReady (ready: boolean, callback?: (ready: boolean) => void): void {
    this.nftCollectionState.ready = ready;

    if (callback) {
      callback(ready);
    }

    this.nftCollectionSubject.next(this.nftCollectionState);
  }

  public resetNftCollection (): void {
    this.nftCollectionState = {
      ready: false,
      nftCollectionList: []
    } as NftCollectionJson;

    this.nftCollectionSubject.next(this.nftCollectionState);
  }

  public getNftCollection () {
    return this.nftCollectionState;
  }

  public getNftCollectionSubscription (update: (value: NftCollectionJson) => void): void {
    update(this.nftCollectionState);
  }

  public subscribeNftCollection () {
    return this.nftCollectionSubject;
  }

  public resetNft (): void {
    this.nftState = {
      total: 0,
      nftList: []
    } as NftJson;

    this.nftSubject.next(this.nftState);
  }

  public setNft (data: NftJson, callback?: (nftData: NftJson) => void): void {
    this.nftState = data;

    if (callback) {
      callback(data);
    }

    this.nftSubject.next(this.nftState);
  }

  public updateNft (nftData: NftItem, callback?: (nftData: NftItem) => void): void {
    this.nftState.nftList.push(nftData);

    if (callback) {
      callback(nftData);
    }

    this.nftSubject.next(this.nftState);
  }

  public getNft () {
    return this.nftState;
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

  public setHistory (historyMap: Record<string, TransactionHistoryItemType[]>) {
    this.historyMap = historyMap;

    this.historySubject.next(this.historyMap);
  }

  public getCurrentAccount (update: (value: CurrentAccountInfo) => void): void {
    this.currentAccountStore.get('CurrentAccountInfo', update);
  }

  public setCurrentAccount (data: CurrentAccountInfo, callback?: () => void): void {
    this.currentAccountStore.set('CurrentAccountInfo', data, callback);

    this.updateServiceInfo();
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

  public resetBalanceMap () {
    Object.values(this.balanceMap).forEach((balance) => {
      balance.state = APIItemState.PENDING;
    });
    this.balanceSubject.next(this.getBalance());
  }

  public resetStakingMap () {
    Object.values(this.stakingMap).forEach((staking) => {
      staking.state = APIItemState.PENDING;
    });
    this.stakingSubject.next(this.getStaking());
  }

  public resetCrowdloanMap () {
    Object.values(this.crowdloanMap).forEach((item) => {
      item.state = APIItemState.PENDING;
    });
    this.crowdloanSubject.next(this.getCrowdloan());
  }

  public setBalanceItem (networkKey: string, item: BalanceItem) {
    this.balanceMap[networkKey] = item;
    this.lazyNext('setBalanceItem', () => {
      this.balanceSubject.next(this.getBalance());
    });
  }

  public subscribeBalance () {
    return this.balanceSubject;
  }

  public async fetchCrowdloanFundMap () {
    this.crowdloanFundmap = await fetchDotSamaCrowdloan();
  }

  public getCrowdloan (): CrowdloanJson {
    return { details: this.crowdloanMap } as CrowdloanJson;
  }

  public setCrowdloanItem (networkKey: string, item: CrowdloanItem) {
    // Fill para state
    const crowdloanFundNode = this.crowdloanFundmap[networkKey];

    if (crowdloanFundNode) {
      item.paraState = convertFundStatus(crowdloanFundNode.status);
    }

    // Update crowdloan map
    this.crowdloanMap[networkKey] = item;
    this.lazyNext('setCrowdloanItem', () => {
      this.crowdloanSubject.next(this.getCrowdloan());
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

  public upsertChainRegistry (tokenData: CustomEvmToken) {
    const chainRegistry = this.chainRegistryMap[tokenData.chain];
    let tokenKey = '';

    for (const [key, token] of Object.entries(chainRegistry.tokenMap)) {
      if (token.erc20Address === tokenData.smartContract) {
        tokenKey = key;
        break;
      }
    }

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
      const erc20Tokens = evmTokens ? evmTokens.erc20 : [];

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

  private getTransactionKey (address: string, networkKey: string): string {
    return `${address}_${networkKey}`;
  }

  public getTransactionHistory (address: string, networkKey: string, update: (items: TransactionHistoryItemType[]) => void): void {
    this.transactionHistoryStore.get(this.getTransactionKey(address, networkKey), (items) => {
      if (!items) {
        update([]);
      } else {
        update(items);
      }
    });
  }

  public getTransactionHistoryByMultiNetworks (address: string, networkKeys: string[], update: (items: TransactionHistoryItemType[]) => void): void {
    const keys: string[] = networkKeys.map((n) => this.getTransactionKey(address, n));

    this.transactionHistoryStore.getByMultiKeys(keys, (items) => {
      if (!items) {
        update([]);
      } else {
        items.sort((a, b) => b.time - a.time);

        update(items);
      }
    });
  }

  public subscribeHistory () {
    return this.historySubject;
  }

  public getHistoryMap (): Record<string, TransactionHistoryItemType[]> {
    return this.historyMap;
  }

  public setTransactionHistory (address: string, networkKey: string, item: TransactionHistoryItemType, callback?: (items: TransactionHistoryItemType[]) => void): void {
    this.getTransactionHistory(address, networkKey, (items) => {
      if (!items || !items.length) {
        items = [item];
      } else {
        items.unshift(item);
      }

      this.transactionHistoryStore.set(this.getTransactionKey(address, networkKey), items, () => {
        callback && callback(items);
      });
    });
  }

  public setTransactionHistoryV2 (address: string, networkKey: string, items: TransactionHistoryItemType[]) {
    this.transactionHistoryStore.set(this.getTransactionKey(address, networkKey), items);
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

  public getErc20Tokens () {
    return this.evmTokenState.erc20;
  }

  public getErc721Tokens () {
    return this.evmTokenState.erc721;
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
          _evmTokenState.erc20.splice(index, 1);
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
          _evmTokenState.erc721.splice(index, 1);
          needUpdateChainRegistry = true;
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

  public getEthereumChains (): string[] {
    const result: string[] = [];

    Object.keys(this.networkMap).forEach((k) => {
      if (this.networkMap[k].isEthereum) {
        result.push(k);
      }
    });

    return result;
  }

  public subscribeNetworkMap () {
    return this.networkMapStore.getSubject();
  }

  public async upsertNetworkMap (data: NetworkJson): Promise<void> {
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

      if (data.crowdloanUrl) {
        this.networkMap[data.key].crowdloanUrl = data.crowdloanUrl;
      }

      if (data.coinGeckoKey) {
        this.networkMap[data.key].coinGeckoKey = data.coinGeckoKey;
      }

      if (data.paraId) {
        this.networkMap[data.key].paraId = data.paraId;
      }

      if (data.blockExplorer) {
        this.networkMap[data.key].blockExplorer = data.blockExplorer;
      }
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
  }

  public async removeNetworkMap (networkKey: string) {
    await this.disableNetworkMap(networkKey);
    delete this.networkMap[networkKey];

    this.networkMapSubject.next(this.networkMap);
    this.networkMapStore.set('NetworkMap', this.networkMap);
    this.updateServiceInfo();
  }

  public async disableNetworkMap (networkKey: string) {
    await this.apiMap.dotSama[networkKey].api.disconnect();
    delete this.apiMap.dotSama[networkKey];

    if (this.networkMap[networkKey].isEthereum && this.networkMap[networkKey].isEthereum) {
      delete this.apiMap.web3[networkKey];
    }

    this.networkMap[networkKey].active = false;
    this.networkMap[networkKey].apiStatus = NETWORK_STATUS.DISCONNECTED;
    this.networkMapSubject.next(this.networkMap);
    this.networkMapStore.set('NetworkMap', this.networkMap);
    this.updateServiceInfo();
  }

  public async disableAllNetworks () {
    for (const [key, network] of Object.entries(this.networkMap)) {
      if (network.active) {
        await this.apiMap.dotSama[key].api.disconnect();
        delete this.apiMap.dotSama[key];

        if (this.networkMap[key].isEthereum && this.networkMap[key].isEthereum) {
          delete this.apiMap.web3[key];
        }

        this.networkMap[key].active = false;
        this.networkMap[key].apiStatus = NETWORK_STATUS.DISCONNECTED;
      }
    }

    this.networkMapSubject.next(this.networkMap);
    this.networkMapStore.set('NetworkMap', this.networkMap);
    this.updateServiceInfo();
  }

  public enableNetworkMap (networkKey: string) {
    this.apiMap.dotSama[networkKey] = initApi(networkKey, getCurrentProvider(this.networkMap[networkKey]), this.networkMap[networkKey].isEthereum);

    if (this.networkMap[networkKey].isEthereum && this.networkMap[networkKey].isEthereum) {
      this.apiMap.web3[networkKey] = initWeb3Api(getCurrentProvider(this.networkMap[networkKey]));
    }

    this.networkMap[networkKey].active = true;
    this.networkMapSubject.next(this.networkMap);
    this.networkMapStore.set('NetworkMap', this.networkMap);
    this.updateServiceInfo();
  }

  public enableAllNetworks () {
    for (const [key, network] of Object.entries(this.networkMap)) {
      if (!network.active) {
        this.apiMap.dotSama[key] = initApi(key, getCurrentProvider(this.networkMap[key]), this.networkMap[key].isEthereum);

        if (this.networkMap[key].isEthereum && this.networkMap[key].isEthereum) {
          this.apiMap.web3[key] = initWeb3Api(getCurrentProvider(this.networkMap[key]));
        }

        this.networkMap[key].active = true;
      }
    }

    this.networkMapSubject.next(this.networkMap);
    this.networkMapStore.set('NetworkMap', this.networkMap);
    this.updateServiceInfo();
  }

  public async resetDefaultNetwork () {
    for (const [key, network] of Object.entries(this.networkMap)) {
      if (!network.active) {
        if (key === 'polkadot' || key === 'kusama') {
          this.apiMap.dotSama[key] = initApi(key, getCurrentProvider(this.networkMap[key]), this.networkMap[key].isEthereum);
          this.networkMap[key].active = true;
        }
      } else {
        if (key !== 'polkadot' && key !== 'kusama') {
          await this.apiMap.dotSama[key].api.disconnect();
          delete this.apiMap.dotSama[key];

          if (this.networkMap[key].isEthereum && this.networkMap[key].isEthereum) {
            delete this.apiMap.web3[key];
          }

          this.networkMap[key].active = false;
          this.networkMap[key].apiStatus = NETWORK_STATUS.DISCONNECTED;
        }
      }
    }

    this.networkMapSubject.next(this.networkMap);
    this.networkMapStore.set('NetworkMap', this.networkMap);
    this.updateServiceInfo();
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

  public getWeb3ApiMap () {
    return this.apiMap.web3;
  }

  public getApiMap () {
    return this.apiMap;
  }

  public refreshWeb3Api (key: string) {
    this.apiMap.web3[key] = initWeb3Api(getCurrentProvider(this.networkMap[key]));
  }

  public subscribeServiceInfo () {
    return this.serviceInfoSubject;
  }

  public updateServiceInfo () {
    this.currentAccountStore.get('CurrentAccountInfo', (value) => {
      this.serviceInfoSubject.next({
        networkMap: this.networkMap,
        apiMap: this.apiMap,
        currentAccountInfo: value,
        chainRegistry: this.chainRegistryMap,
        customErc721Registry: this.getErc721Tokens()
      });
    });
  }
}
