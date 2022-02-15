// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Subject } from 'rxjs';

import State from '@polkadot/extension-base/background/handlers/State';
import { APIItemState, BalanceItem, BalanceJson, ChainRegistry, CrowdloanItem, CrowdloanJson, CurrentAccountInfo, NftJson, PriceJson, StakingJson, TransactionHistoryItemType } from '@polkadot/extension-base/background/KoniTypes';
import { getTokenPrice } from '@polkadot/extension-koni-base/api/coingecko';
import NETWORKS from '@polkadot/extension-koni-base/api/endpoints';
import { CurrentAccountStore, PriceStore } from '@polkadot/extension-koni-base/stores';
import StakingStore from '@polkadot/extension-koni-base/stores/Staking';
import TransactionHistoryStore from '@polkadot/extension-koni-base/stores/TransactionHistory';

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
  private readonly priceStore = new PriceStore();
  private readonly currentAccountStore = new CurrentAccountStore();
  // private readonly nftStore = new NftStore();
  private readonly stakingStore = new StakingStore();
  private priceStoreReady = false;
  private readonly transactionHistoryStore = new TransactionHistoryStore();

  // private nftStoreReady = false;
  // private stakingStoreReady = false;
  // Todo: Persist data to balanceStore later
  // private readonly balanceStore = new BalanceStore();
  private balanceMap: Record<string, BalanceItem> = generateDefaultBalanceMap();
  private balanceSubject = new Subject<BalanceJson>();

  private nftState: NftJson = {
    ready: true,
    total: 0,
    nftList: []
  } as NftJson;

  private stakingState: StakingJson = {
    ready: true,
    details: []
  } as StakingJson;

  private crowdloanMap: Record<string, CrowdloanItem> = generateDefaultCrowdloanMap();
  private crowdloanSubject = new Subject<CrowdloanJson>();
  private nftSubject = new Subject<NftJson>();
  private stakingSubject = new Subject<StakingJson>();

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

  public getStaking (account: string, update: (value: StakingJson) => void): void {
    update(this.stakingState);

    // this.stakingStore.get('StakingData', (rs) => {
    //   if (this.stakingStoreReady) update(rs);
    //   else {
    //     getStakingInfo(account)
    //       .then((rs) => {
    //         this.setStaking(rs);
    //         update(rs);
    //       })
    //       .catch((e) => {
    //         console.error(e);
    //         throw e;
    //       });
    //   }
    // });
  }

  public subscribeStaking () {
    return this.stakingSubject;
  }

  public setStaking (stakingData: StakingJson, callback?: (stakingData: StakingJson) => void): void {
    this.stakingStore.set('StakingData', stakingData, () => {
      if (callback) {
        callback(stakingData);
        // this.stakingStoreReady = true;
      }

      this.stakingSubject.next(stakingData);
    });
  }

  public setNft (nftData: NftJson, callback?: (nftData: NftJson) => void): void {
    this.nftState = nftData;

    if (callback) {
      callback(nftData);
    }

    this.nftSubject.next(nftData);
  }

  public getNft (account: string, update: (value: NftJson) => void): void {
    update(this.nftState);

    // return this.nftState;

    // this.nftStore.get('NftData', (rs) => {
    //   if (this.nftStoreReady) update(rs);
    //   else {
    //     getAllNftsByAccount(account)
    //       .then((rs) => {
    //         this.nftState = rs;
    //         console.log('got nft', this.nftState)
    //         update(rs);
    //       })
    //       .catch((e) => {
    //         console.error(e);
    //         throw e;
    //       });
    //   }
    // });
  }

  public subscribeNft () {
    return this.nftSubject;
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
        if (account) resolve(account.address);
        else resolve(null);
      });
    });
  }

  public getBalance (): BalanceJson {
    return { details: this.balanceMap } as BalanceJson;
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

  public getCrowdloan (): CrowdloanJson {
    return { details: this.crowdloanMap } as CrowdloanJson;
  }

  public setCrowdloanItem (networkKey: string, item: CrowdloanItem) {
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
}
