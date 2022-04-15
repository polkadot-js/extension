// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BehaviorSubject, Subject } from 'rxjs';

import { withErrorLog } from '@polkadot/extension-base/background/handlers/helpers';
import State, { AuthUrls, Resolver } from '@polkadot/extension-base/background/handlers/State';
import { AccountRefMap, APIItemState, AuthRequestV2, BalanceItem, BalanceJson, ChainRegistry, CrowdloanItem, CrowdloanJson, CurrentAccountInfo, NetworkJson, NftCollection, NftCollectionJson, NftItem, NftJson, NftTransferExtra, PriceJson, ResultResolver, StakingItem, StakingJson, StakingRewardJson, TransactionHistoryItemType } from '@polkadot/extension-base/background/KoniTypes';
import { AuthorizeRequest, RequestAuthorizeTab } from '@polkadot/extension-base/background/types';
import { getId } from '@polkadot/extension-base/utils/getId';
import { getTokenPrice } from '@polkadot/extension-koni-base/api/coingecko';
import NETWORKS from '@polkadot/extension-koni-base/api/endpoints';
import { PREDEFINED_NETWORKS } from '@polkadot/extension-koni-base/api/predefinedNetworks';
import { DEFAULT_STAKING_NETWORKS } from '@polkadot/extension-koni-base/api/staking';
// eslint-disable-next-line camelcase
import { DotSamaCrowdloan_crowdloans_nodes } from '@polkadot/extension-koni-base/api/subquery/__generated__/DotSamaCrowdloan';
import { fetchDotSamaCrowdloan } from '@polkadot/extension-koni-base/api/subquery/crowdloan';
import { CurrentAccountStore, NetworkMapStore, PriceStore } from '@polkadot/extension-koni-base/stores';
import AccountRefStore from '@polkadot/extension-koni-base/stores/AccountRef';
import AuthorizeStore from '@polkadot/extension-koni-base/stores/Authorize';
import TransactionHistoryStore from '@polkadot/extension-koni-base/stores/TransactionHistory';
import { convertFundStatus } from '@polkadot/extension-koni-base/utils/utils';
import { accounts } from '@polkadot/ui-keyring/observable/accounts';
import { assert } from '@polkadot/util';

function generateDefaultBalanceMap () {
  const balanceMap: Record<string, BalanceItem> = {};

  Object.keys(NETWORKS).forEach((networkKey) => {
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
      name: NETWORKS[networkKey].chain,
      chainId: networkKey,
      nativeToken: NETWORKS[networkKey].nativeToken,
      state: APIItemState.PENDING
    } as StakingItem;
  });

  return stakingMap;
}

function generateDefaultCrowdloanMap () {
  const crowdloanMap: Record<string, CrowdloanItem> = {};

  Object.keys(NETWORKS).forEach((networkKey) => {
    crowdloanMap[networkKey] = {
      state: APIItemState.PENDING,
      contribute: '0'
    };
  });

  return crowdloanMap;
}

export default class KoniState extends State {
  public readonly authSubjectV2: BehaviorSubject<AuthorizeRequest[]> = new BehaviorSubject<AuthorizeRequest[]>([]);

  private readonly networkMapStore = new NetworkMapStore(); // persist custom networkMap by user
  private readonly priceStore = new PriceStore();
  private readonly currentAccountStore = new CurrentAccountStore();
  private readonly accountRefStore = new AccountRefStore();
  private readonly authorizeStore = new AuthorizeStore();
  readonly #authRequestsV2: Record<string, AuthRequestV2> = {};
  private priceStoreReady = false;
  private readonly transactionHistoryStore = new TransactionHistoryStore();

  // init default value for networkMap (first time only)
  public initNetworkMapStore () {
    this.networkMapStore.get('NetworkMap', (storedNetworkMap) => {
      if (!storedNetworkMap) { // first time init extension
        this.networkMapStore.set('NetworkMap', PREDEFINED_NETWORKS);
        this.networkMap = PREDEFINED_NETWORKS;
      } else { // merge custom providers in stored data with predefined data
        const mergedNetworkMap: Record<string, NetworkJson> = PREDEFINED_NETWORKS;

        for (const [key, network] of Object.entries(storedNetworkMap)) {
          if (key in PREDEFINED_NETWORKS) {
            // check change and override custom providers if exist
            if ('customProviders' in network) {
              mergedNetworkMap[key].customProviders = network.customProviders;
            }

            if (network.customProviders && Object.keys(network.customProviders).includes(network.currentProvider)) {
              mergedNetworkMap[key].currentProvider = network.currentProvider;
              mergedNetworkMap[key].currentProviderMode = mergedNetworkMap[key].currentProvider.startsWith('http') ? 'http' : 'ws';
            }
          } else {
            mergedNetworkMap[key] = network;
          }
        }

        this.networkMapStore.set('NetworkMap', mergedNetworkMap);
        this.networkMap = mergedNetworkMap; // init networkMap state
      }
    });
  }

  private networkMap: Record<string, NetworkJson> = {}; // mapping to networkMapStore, for uses in background
  private networkMapSubject = new Subject<Record<string, NetworkJson>>();

  // Todo: Persist data to balanceStore later
  // private readonly balanceStore = new BalanceStore();
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
        Object.keys(isAllowedMap).forEach((address) => {
          if (accounts.includes(address)) {
            isAllowedMap[address] = true;
          } else {
            isAllowedMap[address] = false;
          }
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
      this.popupOpen();
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
        getTokenPrice()
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

  public upsertNetworkMap (data: NetworkJson): void {
    if (data.key in this.networkMap) { // update provider for existed network
      const existedNetwork = this.networkMap[data.key];

      if (data.customProviders) {
        existedNetwork.customProviders = data.customProviders;
      }

      if (data.currentProvider !== existedNetwork.currentProvider) {
        existedNetwork.currentProvider = data.currentProvider;
        existedNetwork.currentProviderMode = existedNetwork.currentProvider.startsWith('ws') ? 'ws' : 'http';
      }

      this.networkMap[data.key] = existedNetwork;
    } else { // insert
      this.networkMap[data.key] = data;
    }

    this.networkMapSubject.next(this.networkMap);
    this.networkMapStore.set('NetworkMap', this.networkMap);
  }

  public getNetworkMap () {
    return this.networkMap;
  }

  public subscribeNetworkMap () {
    return this.networkMapStore.getSubject();
  }

  public async removeNetworkMap (networkKey: string) {
    if (this.networkMap[networkKey].active && this.networkMap[networkKey].getDotsamaAPI) {
      await this.networkMap[networkKey]?.getDotsamaAPI?.disconnect();
    }

    delete this.networkMap[networkKey];

    this.networkMapSubject.next(this.networkMap);
    this.networkMapStore.set('NetworkMap', this.networkMap);
  }

  public disableNetworkMap (networkKey: string) {
    this.networkMap[networkKey].active = false;

    this.networkMapSubject.next(this.networkMap);
    this.networkMapStore.set('NetworkMap', this.networkMap);
  }

  public enableNetworkMap (networkKey: string) {
    this.networkMap[networkKey].active = true;

    this.networkMapSubject.next(this.networkMap);
    this.networkMapStore.set('NetworkMap', this.networkMap);
  }
}
