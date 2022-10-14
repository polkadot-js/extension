// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { APIItemState, BalanceItem, BalanceJson, CrowdloanItem, NftCollection, NftItem, StakingItem, TransactionHistoryItemType } from '@subwallet/extension-base/background/KoniTypes';
import { Subscription } from 'dexie';

import { logger as createLogger } from '@polkadot/util';
import { Logger } from '@polkadot/util/types';

import KoniDatabase, { INft } from '../databases';
import { BalanceStore, CrowdloanStore, MigrationStore, NftCollectionStore, NftStore, StakingStore, TransactionStore } from '../db-stores';

export default class DatabaseService {
  private _db: KoniDatabase;
  public stores;
  private logger: Logger;
  private nftSubscription: Subscription | undefined;

  constructor () {
    this.logger = createLogger('DB-Service');
    this._db = new KoniDatabase();
    this.stores = {
      balance: new BalanceStore(this._db.balances),
      nft: new NftStore(this._db.nfts),
      nftCollection: new NftCollectionStore(this._db.nftCollections),
      crowdloan: new CrowdloanStore(this._db.crowdloans),
      staking: new StakingStore(this._db.stakings),
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
  async updateStakingStore (chain: string, chainHash: string, address: string, item: StakingItem) {
    if (item.state === APIItemState.READY) {
      this.logger.log(`Updating staking for [${chain}]`);

      return this.stores.staking.upsert({ chainHash, chain, address, ...item });
    }
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
  subscribeNft (addresses: string[], chainHashs?: string[], callback?: (nfts: INft[]) => void) {
    this.nftSubscription && this.nftSubscription.unsubscribe();

    this.nftSubscription = this.stores.nft.subscribeNft(addresses, chainHashs).subscribe({
      next: (nfts) => callback && callback(nfts)
    });

    return this.nftSubscription;
  }

  async getNft (addresses: string[], chainHashs?: string[]) {
    const nfts = await this.stores.nft.getNft(addresses, chainHashs);

    this.logger.log('Nfts: ', nfts);

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

  deleteNftsByEvmToken (chainHash: string, tokenId: string) {
    return this.stores.nft.deleteNftsByCollection(chainHash, tokenId);
  }

  removeNfts (chainHash: string, address: string, collectionId: string, nftIds: string[]) {
    this.logger.log(`Remove NFTs [${nftIds.join(', ')}]`);

    return this.stores.nft.removeNfts(chainHash, address, collectionId, nftIds);
  }
}
