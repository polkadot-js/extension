// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/chain-list/types';
import { APIItemState, BalanceItem, ChainStakingMetadata, CrowdloanItem, NftCollection, NftItem, NominatorMetadata, StakingItem, TransactionHistoryItem } from '@subwallet/extension-base/background/KoniTypes';
import KoniDatabase, { IBalance, IChain, ICrowdloanItem, INft } from '@subwallet/extension-base/services/storage-service/databases';
import { AssetStore, BalanceStore, ChainStore, CrowdloanStore, ExtraDelegationInfoStore, MigrationStore, NftCollectionStore, NftStore, StakingStore, TransactionStore } from '@subwallet/extension-base/services/storage-service/db-stores';
import ChainStakingMetadataStore from '@subwallet/extension-base/services/storage-service/db-stores/ChainStakingMetadata';
import NominatorMetadataStore from '@subwallet/extension-base/services/storage-service/db-stores/NominatorMetadata';
import { HistoryQuery } from '@subwallet/extension-base/services/storage-service/db-stores/Transaction';
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
      balance: new BalanceStore(this._db.balances),
      nft: new NftStore(this._db.nfts),
      nftCollection: new NftCollectionStore(this._db.nftCollections),
      crowdloan: new CrowdloanStore(this._db.crowdloans),
      staking: new StakingStore(this._db.stakings),
      transaction: new TransactionStore(this._db.transactions),
      migration: new MigrationStore(this._db.migrations),
      extraDelegationInfo: new ExtraDelegationInfoStore(this._db.extraDelegationInfo),

      chain: new ChainStore(this._db.chain),
      asset: new AssetStore(this._db.asset),

      // staking
      chainStakingMetadata: new ChainStakingMetadataStore(this._db.chainStakingMetadata),
      nominatorMetadata: new NominatorMetadataStore(this._db.nominatorMetadata)
    };
  }

  // Balance
  async updateBalanceStore (address: string, item: BalanceItem) {
    if (item.state === APIItemState.READY) {
      this.logger.log(`Updating balance for [${item.tokenSlug}]`);

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
      this.logger.log(`Updating crowdloan for [${chain}]`);

      return this.stores.crowdloan.upsert({ chain, address, ...item } as ICrowdloanItem);
    } else {
      this.logger.debug(`Removing crowdloan for [${chain}]`);

      return this.stores.crowdloan.deleteByChainAndAddress(chain, address);
    }
  }

  // Staking
  async updateStaking (chain: string, address: string, item: StakingItem) {
    if (item.state === APIItemState.READY) {
      this.logger.log(`Updating staking for [${chain}]`);

      return this.stores.staking.upsert(item);
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
    const histories = await this.stores.transaction.queryHistory(query);

    this.logger.log('Get histories: ', histories);

    return histories;
  }

  async upsertHistory (histories: TransactionHistoryItem[]) {
    this.logger.log('Updating transaction histories');

    return this.stores.transaction.bulkUpsert(histories);
  }

  // NFT Collection
  async addNftCollection (collection: NftCollection) {
    this.logger.log(`Updating NFT collection for [${collection.chain}]`);

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

  async getNft (addresses: string[], chainHashes?: string[]) {
    const nfts = await this.stores.nft.getNft(addresses, chainHashes);

    this.logger.log('Get NFTs: ', nfts);

    return nfts;
  }

  async addNft (address: string, nft: NftItem) {
    this.logger.log(`Updating NFT for [${nft.chain}]`);

    return this.stores.nft.upsert({ ...nft, address } as INft);
  }

  async deleteRemovedNftsFromCollection (chainHash: string, address: string, collectionId?: string, nftIds?: string[]) {
    return this.stores.nft.deleteRemovedNftsFromCollection(chainHash, address, collectionId, nftIds);
  }

  deleteNftsFromRemovedCollection (chainHash: string, address: string, collectionIds: string[]) {
    return this.stores.nft.deleteNftsFromRemovedCollection(chainHash, address, collectionIds);
  }

  removeNfts (chain: string, address: string, collectionId: string, nftIds: string[]) {
    this.logger.log(`Remove NFTs [${nftIds.join(', ')}]`);

    return this.stores.nft.removeNfts(chain, address, collectionId, nftIds);
  }

  // Delegation info
  async updateExtraDelegationInfo (chain: string, address: string, collatorAddress: string) {
    return this.stores.extraDelegationInfo.upsert({ chain, address, collatorAddress });
  }

  async getExtraDelegationInfo (chain: string, address: string) {
    const delegationInfo = await this.stores.extraDelegationInfo.getDelegationInfo(chain, address);

    this.logger.log('Get extra delegation info: ', delegationInfo);

    return delegationInfo;
  }

  // Chain
  async updateChainStore (item: IChain) {
    this.logger.log(`Updating storageInfo for chain [${item.slug}]`);

    return this.stores.chain.upsert(item);
  }

  async bulkUpdateChainStore (data: IChain[]) {
    this.logger.log('Bulk updating ChainStore');

    return this.stores.chain.bulkUpsert(data);
  }

  async removeFromChainStore (chains: string[]) {
    this.logger.log('Bulk removing ChainStore');

    return this.stores.chain.removeChains(chains);
  }

  async getAllChainStore () {
    const allChains = await this.stores.chain.getAll();

    this.logger.log('Get all chains: ', allChains);

    return allChains;
  }

  // Asset
  async updateAssetStore (item: _ChainAsset) {
    this.logger.log(`Updating storageInfo for chainAsset [${item.originChain}]`);

    return this.stores.asset.upsert(item);
  }

  async getAllAssetStore () {
    const allAssets = await this.stores.asset.getAll();

    this.logger.log('Get all stored assets: ', allAssets);

    return allAssets;
  }

  async removeFromAssetStore (items: string[]) {
    this.logger.log('Bulk removing AssetStore');

    return this.stores.asset.removeAssets(items);
  }

  // Staking
  async updateChainStakingMetadata (item: ChainStakingMetadata) {
    this.logger.log('Update ChainStakingMetadata: ', item);

    return this.stores.chainStakingMetadata.upsert(item);
  }

  async getChainStakingMetadata () {
    return this.stores.chainStakingMetadata.getAll();
  }

  async updateNominatorMetadata (item: NominatorMetadata) {
    this.logger.log('Update NominatorMetadata: ', item);

    return this.stores.nominatorMetadata.upsert(item);
  }
}
