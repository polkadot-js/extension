// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/chain-list/types';
import { APIItemState, BalanceItem, CrowdloanItem, NftCollection, NftItem, StakingItem, TransactionHistoryItemType } from '@subwallet/extension-base/background/KoniTypes';
import KoniDatabase, { IChain, INft, IStakingItem } from '@subwallet/extension-base/services/storage-service/databases';
import { AssetStore, BalanceStore, ChainStore, CrowdloanStore, ExtraDelegationInfoStore, MigrationStore, NftCollectionStore, NftStore, StakingStore, TransactionStore } from '@subwallet/extension-base/services/storage-service/db-stores';
import { Subscription } from 'dexie';

import { logger as createLogger } from '@polkadot/util';
import { Logger } from '@polkadot/util/types';

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
      staking: new StakingStore(this._db.stakings),
      transaction: new TransactionStore(this._db.transactions),
      migration: new MigrationStore(this._db.migrations),
      extraDelegationInfo: new ExtraDelegationInfoStore(this._db.extraDelegationInfo),

      chain: new ChainStore(this._db.chain),
      asset: new AssetStore(this._db.asset)
    };
  }

  // Balance
  async updateBalanceStore (chain: string, chainHash: string, address: string, item: BalanceItem) {
    if (item.state === APIItemState.READY) {
      this.logger.log(`Updating balance for [${chain}]`);

      return this.stores.balance.upsert({ chainHash, _chain: chain, address, ...item });
    }
  }

  // public getBalanceObservable (address: string, cb: (result: BalanceJson) => void) {
  //   return this.stores.balance.liveQueryBalance(address, cb);
  // }

  // Crowdloan
  async updateCrowdloanStore (chain: string, chainHash: string, address: string, item: CrowdloanItem) {
    if (item.state === APIItemState.READY && item.contribute !== '0') {
      this.logger.log(`Updating crowdloan for [${chain}]`);

      return this.stores.crowdloan.upsert({ chainHash, _chain: chain, address, ...item });
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

    return this.stores.transaction.bulkUpsert(histories.map((item) => ({ chainHash, _chain: chain, address, eventIdx: 0, ...item })));
  }

  // NFT Collection
  async addNftCollection (chain: string, chainHash: string, collection: NftCollection) {
    this.logger.log(`Updating NFT collection for [${chain}]`);

    return this.stores.nftCollection.upsert({ chainHash, _chain: chain, ...collection });
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

  async addNft (chain: string, chainHash: string, address: string, nft: NftItem) {
    this.logger.log(`Updating NFT for [${chain}]`);

    return this.stores.nft.upsert({ ...nft, chainHash, _chain: chain, address });
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

  // Delegation info
  async updateExtraDelegationInfo (chain: string, chainHash: string, address: string, collatorAddress: string) {
    return this.stores.extraDelegationInfo.upsert({ chain, chainHash, address, collatorAddress });
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
}
