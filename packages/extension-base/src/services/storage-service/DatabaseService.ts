// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/chain-list/types';
import { APIItemState, BalanceItem, ChainStakingMetadata, CrowdloanItem, NftCollection, NftItem, NominatorMetadata, PriceJson, StakingItem, StakingType, TransactionHistoryItem } from '@subwallet/extension-base/background/KoniTypes';
import KoniDatabase, { IBalance, IChain, ICrowdloanItem, INft } from '@subwallet/extension-base/services/storage-service/databases';
import { AssetStore, BalanceStore, ChainStore, CrowdloanStore, MigrationStore, NftCollectionStore, NftStore, PriceStore, StakingStore, TransactionStore } from '@subwallet/extension-base/services/storage-service/db-stores';
import ChainStakingMetadataStore from '@subwallet/extension-base/services/storage-service/db-stores/ChainStakingMetadata';
import NominatorMetadataStore from '@subwallet/extension-base/services/storage-service/db-stores/NominatorMetadata';
import { HistoryQuery } from '@subwallet/extension-base/services/storage-service/db-stores/Transaction';
import { reformatAddress } from '@subwallet/extension-base/utils';
import { Subscription } from 'dexie';

import { logger as createLogger } from '@polkadot/util';
import { Logger } from '@polkadot/util/types';

export default class DatabaseService {
  private _db: KoniDatabase;
  public stores;
  private logger: Logger;
  // TODO: might remove this
  private nftSubscription: Subscription | undefined;
  private stakingSubscription: Subscription | undefined;

  constructor () {
    this.logger = createLogger('DB-Service');
    this._db = new KoniDatabase();
    this.stores = {
      price: new PriceStore(this._db.price),
      balance: new BalanceStore(this._db.balances),
      nft: new NftStore(this._db.nfts),
      nftCollection: new NftCollectionStore(this._db.nftCollections),
      crowdloan: new CrowdloanStore(this._db.crowdloans),
      staking: new StakingStore(this._db.stakings),
      transaction: new TransactionStore(this._db.transactions),
      migration: new MigrationStore(this._db.migrations),

      chain: new ChainStore(this._db.chain),
      asset: new AssetStore(this._db.asset),

      // staking
      chainStakingMetadata: new ChainStakingMetadataStore(this._db.chainStakingMetadata),
      nominatorMetadata: new NominatorMetadataStore(this._db.nominatorMetadata)
    };
  }

  async updatePriceStore (priceData: PriceJson) {
    await this.stores.price.table.put(priceData);
  }

  async getPriceStore () {
    try {
      const rs = await this.stores.price.table.get('usd');

      return rs;
    } catch (e) {
      return undefined;
    }
  }

  // Balance
  async getStoredBalance () {
    return this.stores.balance.table.toArray();
  }

  async updateBalanceStore (address: string, item: BalanceItem) {
    if (item.state === APIItemState.READY) {
      // this.logger.log(`Updating balance for [${item.tokenSlug}]`);

      return this.stores.balance.upsert({ address, ...item } as IBalance);
    }
  }

  async removeFromBalanceStore (assets: string[]) {
    this.logger.log('Bulk removing AssetStore');

    return this.stores.balance.removeBySlugs(assets);
  }

  // Crowdloan
  async updateCrowdloanStore (chain: string, address: string, item: CrowdloanItem) {
    if (item.state === APIItemState.READY && item.contribute !== '0') {
      // this.logger.log(`Updating crowdloan for [${chain}]`);

      return this.stores.crowdloan.upsert({ chain, address, ...item } as ICrowdloanItem);
    } else {
      // this.logger.debug(`Removing crowdloan for [${chain}]`);

      return this.stores.crowdloan.deleteByChainAndAddress(chain, address);
    }
  }

  // Staking
  async updateStaking (chain: string, address: string, item: StakingItem) {
    if (item.state === APIItemState.READY) {
      // this.logger.log(`Updating staking for [${chain}]`);

      return this.stores.staking.upsert(item);
    }
  }

  async getStakings (addresses: string[], chains?: string[]) {
    // this.logger.log('Get Stakings: ', stakings);

    return this.stores.staking.getStakings(addresses, chains);
  }

  async getStakingsByChains (chains: string[]) {
    return this.stores.staking.getStakingsByChains(chains);
  }

  async getPooledStakings (addresses: string[], chainHashes?: string[]) {
    // this.logger.log('Get Pooled Stakings: ', stakings);

    return this.stores.staking.getPooledStakings(addresses, chainHashes);
  }

  subscribeStaking (addresses: string[], chainList?: string[], callback?: (stakingItems: StakingItem[]) => void) {
    this.stakingSubscription && this.stakingSubscription.unsubscribe();

    this.stakingSubscription = this.stores.staking.subscribeStaking(addresses, chainList).subscribe({
      next: (stakings) => callback && callback(stakings)
    });

    return this.stakingSubscription;
  }

  subscribeChainStakingMetadata (chains: string[], callback: (data: ChainStakingMetadata[]) => void) {
    this.stores.chainStakingMetadata.subscribeByChain(chains).subscribe(({
      next: (data) => callback && callback(data)
    }));
  }

  subscribeNominatorMetadata (callback: (data: NominatorMetadata[]) => void) {
    this.stores.nominatorMetadata.subscribeAll().subscribe(({
      next: (data) => callback && callback(data)
    }));
  }

  // Transaction histories
  async getHistories (query?: HistoryQuery) {
    return this.stores.transaction.queryHistory(query);
  }

  async upsertHistory (histories: TransactionHistoryItem[]) {
    // this.logger.log('Updating transaction histories');
    const cleanedHistory = histories.filter((x) => x && x.address && x.chain && x.extrinsicHash);

    return this.stores.transaction.bulkUpsert(cleanedHistory);
  }

  async updateHistoryByNewExtrinsicHash (extrinsicHash: string, updateData: Partial<TransactionHistoryItem>) {
    // this.logger.log('Updating transaction histories');
    const canUpdate = updateData && extrinsicHash;

    if (!canUpdate) {
      return;
    }

    return this.stores.transaction.updateWithQuery({ extrinsicHash }, updateData);
  }

  // NFT Collection
  async addNftCollection (collection: NftCollection) {
    // this.logger.log(`Updating NFT collection for [${collection.chain}]`);

    return this.stores.nftCollection.upsert(collection);
  }

  async deleteNftCollection (chain: string, collectionId: string) {
    await this.stores.nftCollection.removeCollection(chain, collectionId);
    await this.stores.nft.deleteNftsByCollection(chain, collectionId);
  }

  getAllNftCollection (chainHashes?: string[]) {
    return this.stores.nftCollection.getNftCollection(chainHashes);
  }

  // NFT
  subscribeNft (addresses: string[], chainHashes?: string[], callback?: (nfts: INft[]) => void) {
    this.nftSubscription && this.nftSubscription.unsubscribe();

    this.nftSubscription = this.stores.nft.subscribeNft(addresses, chainHashes).subscribe({
      next: (nfts) => callback && callback(nfts)
    });

    return this.nftSubscription;
  }

  async cleanUpNft (chain: string, owner: string, collectionIds: string[], nftIds: string[], ownNothing?: boolean) {
    if (ownNothing) {
      return this.stores.nft.deleteNftsByChainAndOwner(chain, reformatAddress(owner, 42));
    }

    const result = await this.stores.nft.cleanUpNfts(chain, reformatAddress(owner, 42), collectionIds, nftIds);

    result > 0 && console.debug(`Cleaned up ${result} NFTs on chain ${chain} for owner ${reformatAddress(owner, 42)}`, collectionIds, nftIds);

    return result;
  }

  async getNft (addresses: string[], chainHashes?: string[]) {
    // this.logger.log('Get NFTs: ', nfts);

    return this.stores.nft.getNft(addresses, chainHashes);
  }

  async addNft (address: string, nft: NftItem) {
    // this.logger.log(`Updating NFT for [${nft.chain}]`);

    return this.stores.nft.upsert({ ...nft, address } as INft);
  }

  handleNftTransfer (chain: string, addresses: string[], nftItem: NftItem) {
    return this.stores.nft.deleteNftItem(chain, addresses, nftItem);
  }

  removeNfts (chain: string, address: string, collectionId: string, nftIds: string[]) {
    // this.logger.log(`Remove NFTs [${nftIds.join(', ')}]`);

    return this.stores.nft.removeNfts(chain, address, collectionId, nftIds);
  }

  // Chain
  async updateChainStore (item: IChain) {
    // this.logger.log(`Updating storageInfo for chain [${item.slug}]`);

    return this.stores.chain.upsert(item);
  }

  async bulkUpdateChainStore (data: IChain[]) {
    // this.logger.log('Bulk updating ChainStore');

    return this.stores.chain.bulkUpsert(data);
  }

  async removeFromChainStore (chains: string[]) {
    // this.logger.log('Bulk removing ChainStore');

    return this.stores.chain.removeChains(chains);
  }

  async getAllChainStore () {
    // this.logger.log('Get all chains: ', allChains);

    return this.stores.chain.getAll();
  }

  // Asset
  async updateAssetStore (item: _ChainAsset) {
    // this.logger.log(`Updating storageInfo for chainAsset [${item.originChain}]`);

    return this.stores.asset.upsert(item);
  }

  async getAllAssetStore () {
    // this.logger.log('Get all stored assets: ', allAssets);

    return this.stores.asset.getAll();
  }

  async removeFromAssetStore (items: string[]) {
    // this.logger.log('Bulk removing AssetStore');

    return this.stores.asset.removeAssets(items);
  }

  // Staking
  async updateChainStakingMetadata (item: ChainStakingMetadata) {
    // this.logger.log('Update ChainStakingMetadata: ', item.chain);

    return this.stores.chainStakingMetadata.upsert(item);
  }

  async getChainStakingMetadata () {
    return this.stores.chainStakingMetadata.getAll();
  }

  async getStakingMetadataByChain (chain: string, type = StakingType.NOMINATED) {
    return this.stores.chainStakingMetadata.getByChainAndType(chain, type);
  }

  async updateNominatorMetadata (item: NominatorMetadata) {
    // this.logger.log('Update NominatorMetadata: ', item.address, item.chain);

    return this.stores.nominatorMetadata.upsert(item);
  }

  async getNominatorMetadata () {
    return this.stores.nominatorMetadata.getAll();
  }
}
