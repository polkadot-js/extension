// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import State from '@polkadot/extension-base/background/handlers/State';
import {
  APIItemState,
  BalanceItem,
  BalanceJson, ChainRegistry, CrowdloanItem,
  CrowdloanJson,
  CurrentAccountInfo,
  PriceJson
} from '@polkadot/extension-base/background/KoniTypes';
import { getTokenPrice } from '@polkadot/extension-koni-base/api/coingecko';
import { CurrentAccountStore, PriceStore } from '@polkadot/extension-koni-base/stores';
import {NftJson, PriceJson, StakingJson} from '@polkadot/extension-koni-base/stores/types';
import NftStore from "@polkadot/extension-koni-base/stores/Nft";
import {getAllNftsByAccount} from "@polkadot/extension-koni-base/api/nft";
import StakingStore from "@polkadot/extension-koni-base/stores/Staking";
import {getStakingInfo} from "@polkadot/extension-koni-base/api/rpc_api/staking_info";
import { Subject } from 'rxjs';
import NETWORKS from '@polkadot/extension-koni-base/api/endpoints';

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
  private readonly nftStore = new NftStore();
  private readonly stakingStore = new StakingStore();
  private priceStoreReady = false;
  private nftStoreReady = false;
  private stakingStoreReady = false;

  public getStaking (account: string, update: (value: StakingJson) => void): void {
    this.stakingStore.get('StakingData', (rs) => {
      if (this.stakingStoreReady) update(rs);
      else {
        getStakingInfo(account)
          .then((rs) => {
            this.setStaking(rs);
            update(rs);
          })
          .catch((e) => {
            console.error(e);
            throw e;
          });
      }
    })
  }

  public setStaking (stakingData: StakingJson, callback?: (stakingData: StakingJson) => void): void {
    this.stakingStore.set('StakingData', stakingData, () => {
      if (callback) {
        callback(stakingData);
        this.stakingStoreReady = true;
      }
    })
  }

  public setNft (nftData: NftJson, callback?: (nftData: NftJson) => void): void {
    this.nftStore.set('NftData', nftData, () => {
      if (callback) {
        callback(nftData);
        this.nftStoreReady = true;
      }
    })
  }

  public getNft (account: string, update: (value: NftJson) => void): void {
    this.nftStore.get('NftData', (rs) => {
      if (this.nftStoreReady) update(rs);
      else {
        getAllNftsByAccount(account)
          .then((rs) => {
            this.setNft(rs);
            update(rs);
          })
          .catch((e) => {
            console.error(e);
            throw e;
          });
      }
    })
  }
  private readonly currentAccountStore = new CurrentAccountStore();

  // Todo: Persist data to balanceStore later
  // private readonly balanceStore = new BalanceStore();
  private balanceMap: Record<string, BalanceItem> = generateDefaultBalanceMap();
  private balanceSubject = new Subject<BalanceJson>();
  private crowdloanMap: Record<string, CrowdloanItem> = generateDefaultCrowdloanMap();
  private crowdloanSubject = new Subject<CrowdloanJson>();

  //todo: persist data to store later
  private chainRegistryMap: Record<string, ChainRegistry> = {};
  private chainRegistrySubject = new Subject<Record<string, ChainRegistry>>();

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
      this.getCurrentAccount(({ address }) => {
        resolve(address);
      });
    });
  }

  public getBalance (): BalanceJson {
    return { details: this.balanceMap } as BalanceJson;
  }

  public setBalanceItem (networkKey: string, item: BalanceItem) {
    this.balanceMap[networkKey] = item;
    this.balanceSubject.next(this.getBalance());
  }

  public subscribeBalance () {
    return this.balanceSubject;
  }

  public getCrowdloan (): CrowdloanJson {
    return { details: this.crowdloanMap } as CrowdloanJson;
  }

  public setCrowdloanItem (networkKey: string, item: CrowdloanItem) {
    this.crowdloanMap[networkKey] = item;
    this.crowdloanSubject.next(this.getCrowdloan());
  }

  public subscribeCrowdloan () {
    return this.crowdloanSubject;
  }

  public getChainRegistryMap (): Record<string, ChainRegistry> {
    return this.chainRegistryMap;
  }

  public setChainRegistryItem (networkKey: string, registry: ChainRegistry) {
    this.chainRegistryMap[networkKey] = registry;
    this.chainRegistrySubject.next(this.getChainRegistryMap());
  }

  public subscribeChainRegistryMap () {
    return this.chainRegistrySubject;
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
