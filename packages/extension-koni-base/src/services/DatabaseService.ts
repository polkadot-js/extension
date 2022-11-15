// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { APIItemState, BalanceItem, BalanceJson, CrowdloanItem, NftCollection, NftItem, StakingItem, TransactionHistoryItemType } from '@subwallet/extension-base/background/KoniTypes';
import { Subscription } from 'dexie';

import { logger as createLogger } from '@polkadot/util';
import { Logger } from '@polkadot/util/types';

import KoniDatabase, { INft, IStakingItem } from '../databases';
import { BalanceStore, CrowdloanStore, MigrationStore, NftCollectionStore, NftStore, StakingStore, TransactionStore } from '../db-stores';

export default class DatabaseService {
  private _db: KoniDatabase;
  public stores;
  private logger: Logger;
  private nftSubscription: Subscription | undefined;
  private stakingSubscription: Subscription | undefined;

  constructor () {
    this.logger = createLogger('DB-Service');
    this._db = new KoniDatabase();
    this.stores = {
      balance: new BalanceStore(this._db.balances),
      nft: new NftStore(this._db.nfts),
      nftCollection: new NftCollectionStore(this._db.nftCollections),
      crowdloan: new CrowdloanStore(this._db.crowdloans),
      staking: new StakingStore(this._db.stakingsV2),
      transaction: new TransactionStore(this._db.transactions),
      migration: new MigrationStore(this._db.migrations)
    };
  }

  // Balance
  async updateBalanceStore (chain: string, chainHash: string, address: string, item: BalanceItem) {
    if (item.state === APIItemState.READY) {
      this.logger.log(`Updating balance for [${chain}]`);

      return this.stores.balance.upsert({ chainHash, chain, address, ...item });
    }
  }

  public getBalanceObservable (address: string, cb: (result: BalanceJson) => void) {
    return this.stores.balance.liveQueryBalance(address, cb);
  }

  // Crowdloan
  async updateCrowdloanStore (chain: string, chainHash: string, address: string, item: CrowdloanItem) {
    if (item.state === APIItemState.READY && item.contribute !== '0') {
      this.logger.log(`Updating crowdloan for [${chain}]`);

      return this.stores.crowdloan.upsert({ chainHash, chain, address, ...item });
    } else {
      this.logger.debug(`Removing crowdloan for [${chain}]`);

      return this.stores.crowdloan.deleteByChainAndAddress(chainHash, address);
    }
  }

  // Staking
  async updateStaking (chain: string, chainHash: string, address: string, item: StakingItem) {
    if (item.state === APIItemState.READY) {
      this.logger.log(`Updating staking for [${chain}]`);

      return this.stores.staking.upsert({ chainHash, ...item });
    }
  }

  async getStakings (addresses: string[], chainHashes?: string[]) {
    const stakings = await this.stores.staking.getStakings(addresses, chainHashes);

    this.logger.log('Get Stakings: ', stakings);

    return stakings;
  }

  async getPooledStakings (addresses: string[], chainHashes?: string[]) {
    const stakings = await this.stores.staking.getPooledStakings(addresses, chainHashes);

    this.logger.log('Get Pooled Stakings: ', stakings);

    return stakings;
  }

  subscribeStaking (addresses: string[], chainHashes?: string[], callback?: (stakingItems: IStakingItem[]) => void) {
    this.stakingSubscription && this.stakingSubscription.unsubscribe();

    this.stakingSubscription = this.stores.staking.subscribeStaking(addresses, chainHashes).subscribe({
      next: (stakings) => callback && callback(stakings)
    });

    return this.stakingSubscription;
  }

  // Transaction history
  async addHistories (chain: string, chainHash: string, address: string, histories: TransactionHistoryItemType[]) {
    this.logger.log(`Updating transaction history for [${chain}]`);

    return this.stores.transaction.bulkUpsert(histories.map((item) => ({ chainHash, chain, address, eventIdx: 0, ...item })));
  }

  // NFT Collection
  async addNftCollection (chain: string, chainHash: string, collection: NftCollection) {
    this.logger.log(`Updating NFT collection for [${chain}]`);

    return this.stores.nftCollection.upsert({ chainHash, chain, ...collection });
  }

  getAllNftCollection () {
    return this.stores.nftCollection.getNftCollection();
  }

  // NFT
  subscribeNft (addresses: string[], chainHashes?: string[], callback?: (nfts: INft[]) => void) {
    this.nftSubscription && this.nftSubscription.unsubscribe();

    this.nftSubscription = this.stores.nft.subscribeNft(addresses, chainHashes).subscribe({
      next: (nfts) => callback && callback(nfts)
    });

    return this.nftSubscription;
  }

  async getNft (addresses: string[], chainHashes?: string[]) {
    const nfts = await this.stores.nft.getNft(addresses, chainHashes);

    this.logger.log('Get NFTs: ', nfts);

    return nfts;
  }

  async addNft (chain: string, chainHash: string, address: string, nft: NftItem) {
    this.logger.log(`Updating NFT for [${chain}]`);

    return this.stores.nft.upsert({ ...nft, chainHash, chain, address });
  }

  async deleteRemovedNftsFromCollection (chainHash: string, address: string, collectionId?: string, nftIds?: string[]) {
    return this.stores.nft.deleteRemovedNftsFromCollection(chainHash, address, collectionId, nftIds);
  }

  deleteNftsFromRemovedCollection (chainHash: string, address: string, collectionIds: string[]) {
    return this.stores.nft.deleteNftsFromRemovedCollection(chainHash, address, collectionIds);
  }

  deleteNftsByCustomToken (chainHash: string, tokenId: string) {
    return this.stores.nft.deleteNftsByCollection(chainHash, tokenId);
  }

  removeNfts (chainHash: string, address: string, collectionId: string, nftIds: string[]) {
    this.logger.log(`Remove NFTs [${nftIds.join(', ')}]`);

    return this.stores.nft.removeNfts(chainHash, address, collectionId, nftIds);
  }
}
