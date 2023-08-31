// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/chain-list/types';
import { APIItemState, BalanceItem, ChainStakingMetadata, CrowdloanItem, MantaPayConfig, NftCollection, NftItem, NominatorMetadata, PriceJson, StakingItem, StakingType, TransactionHistoryItem, YieldPoolInfo } from '@subwallet/extension-base/background/KoniTypes';
import { EventService } from '@subwallet/extension-base/services/event-service';
import KoniDatabase, { IBalance, IChain, ICrowdloanItem, INft } from '@subwallet/extension-base/services/storage-service/databases';
import { AssetStore, BalanceStore, ChainStore, CrowdloanStore, MetadataStore, MigrationStore, NftCollectionStore, NftStore, PriceStore, StakingStore, TransactionStore } from '@subwallet/extension-base/services/storage-service/db-stores';
import BaseStore from '@subwallet/extension-base/services/storage-service/db-stores/BaseStore';
import ChainStakingMetadataStore from '@subwallet/extension-base/services/storage-service/db-stores/ChainStakingMetadata';
import MantaPayStore from '@subwallet/extension-base/services/storage-service/db-stores/MantaPay';
import NominatorMetadataStore from '@subwallet/extension-base/services/storage-service/db-stores/NominatorMetadata';
import { HistoryQuery } from '@subwallet/extension-base/services/storage-service/db-stores/Transaction';
import YieldPoolStore from '@subwallet/extension-base/services/storage-service/db-stores/YieldPoolStore';
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

  constructor (private eventService: EventService) {
    this.logger = createLogger('DB-Service');
    this._db = new KoniDatabase();
    this._db.on('ready', () => {
      this.eventService.emit('database.ready', true);
    });
    this.stores = {
      price: new PriceStore(this._db.price),
      balance: new BalanceStore(this._db.balances),
      nft: new NftStore(this._db.nfts),
      nftCollection: new NftCollectionStore(this._db.nftCollections),
      crowdloan: new CrowdloanStore(this._db.crowdloans),
      staking: new StakingStore(this._db.stakings),
      transaction: new TransactionStore(this._db.transactions),
      migration: new MigrationStore(this._db.migrations),

      metadata: new MetadataStore(this._db.metadata),
      chain: new ChainStore(this._db.chain),
      asset: new AssetStore(this._db.asset),

      // yield
      yieldPoolInfo: new YieldPoolStore(this._db.yieldPoolInfo),

      // staking
      chainStakingMetadata: new ChainStakingMetadataStore(this._db.chainStakingMetadata),
      nominatorMetadata: new NominatorMetadataStore(this._db.nominatorMetadata),

      mantaPay: new MantaPayStore(this._db.mantaPay)
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
      this.logger.error(e);

      return undefined;
    }
  }

  // Balance
  async getStoredBalance () {
    console.log('====this.stores.balance.table.toArray', this.stores.balance.table.toArray());

    return this.stores.balance.table.toArray();
  }

  async updateBalanceStore (address: string, item: BalanceItem) {
    if (item.state === APIItemState.READY) {
      return this.stores.balance.upsert({ address, ...item } as IBalance);
    }
  }

  async removeFromBalanceStore (assets: string[]) {
    return this.stores.balance.removeBySlugs(assets);
  }

  // Crowdloan
  async updateCrowdloanStore (chain: string, address: string, item: CrowdloanItem) {
    if (item.state === APIItemState.READY && item.contribute !== '0') {
      return this.stores.crowdloan.upsert({ chain, address, ...item } as ICrowdloanItem);
    } else {
      return this.stores.crowdloan.deleteByChainAndAddress(chain, address);
    }
  }

  // Staking
  async updateStaking (chain: string, address: string, item: StakingItem) {
    if (item.state === APIItemState.READY) {
      return this.stores.staking.upsert(item);
    }
  }

  async getStakings (addresses: string[], chains?: string[]) {
    return this.stores.staking.getStakings(addresses, chains);
  }

  async getStakingsByChains (chains: string[]) {
    return this.stores.staking.getStakingsByChains(chains);
  }

  async getPooledStakings (addresses: string[], chainHashes?: string[]) {
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

  subscribeNominatorMetadata (addresses: string[], callback: (data: NominatorMetadata[]) => void) {
    return this.stores.nominatorMetadata.subscribeByAddresses(addresses).subscribe(({
      next: (data) => callback && callback(data)
    }));
  }

  // Transaction histories
  async getHistories (query?: HistoryQuery) {
    return this.stores.transaction.queryHistory(query);
  }

  async upsertHistory (histories: TransactionHistoryItem[]) {
    const cleanedHistory = histories.filter((x) => x && x.address && x.chain && x.extrinsicHash);

    return this.stores.transaction.bulkUpsert(cleanedHistory);
  }

  async updateHistoryByExtrinsicHash (extrinsicHash: string, updateData: Partial<TransactionHistoryItem>) {
    const canUpdate = updateData && extrinsicHash;

    if (!canUpdate) {
      return;
    }

    return this.stores.transaction.updateWithQuery({ extrinsicHash }, updateData);
  }

  // NFT Collection
  async addNftCollection (collection: NftCollection) {
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
      return this.stores.nft.deleteNftsByChainAndOwner(chain, reformatAddress(owner, 42), collectionIds);
    }

    return this.stores.nft.cleanUpNfts(chain, reformatAddress(owner, 42), collectionIds, nftIds);
  }

  async getNft (addresses: string[], chainHashes?: string[]) {
    return this.stores.nft.getNft(addresses, chainHashes);
  }

  async addNft (address: string, nft: NftItem) {
    return this.stores.nft.upsert({ ...nft, address } as INft);
  }

  handleNftTransfer (chain: string, addresses: string[], nftItem: NftItem) {
    return this.stores.nft.deleteNftItem(chain, addresses, nftItem);
  }

  removeNfts (chain: string, address: string, collectionId: string, nftIds: string[]) {
    return this.stores.nft.removeNfts(chain, address, collectionId, nftIds);
  }

  removeNftsByAddress (address: string) {
    return this.stores.nft.removeNftsByAddress([address]);
  }

  // Chain
  async updateChainStore (item: IChain) {
    return this.stores.chain.upsert(item);
  }

  async bulkUpdateChainStore (data: IChain[]) {
    return this.stores.chain.bulkUpsert(data);
  }

  async removeFromChainStore (chains: string[]) {
    return this.stores.chain.removeChains(chains);
  }

  async getAllChainStore () {
    return this.stores.chain.getAll();
  }

  // Asset
  async updateAssetStore (item: _ChainAsset) {
    return this.stores.asset.upsert(item);
  }

  async getAllAssetStore () {
    return this.stores.asset.getAll();
  }

  async removeFromAssetStore (items: string[]) {
    return this.stores.asset.removeAssets(items);
  }

  // Staking
  async updateChainStakingMetadata (item: ChainStakingMetadata, changes?: Record<string, unknown>) {
    const existingRecord = await this.stores.chainStakingMetadata.getByChainAndType(item.chain, item.type);

    if (existingRecord && changes) {
      return this.stores.chainStakingMetadata.updateByChainAndType(item.chain, item.type, changes);
    }

    return this.stores.chainStakingMetadata.upsert(item);
  }

  async getChainStakingMetadata () {
    return this.stores.chainStakingMetadata.getAll();
  }

  async getStakingMetadataByChain (chain: string, type = StakingType.NOMINATED) {
    return this.stores.chainStakingMetadata.getByChainAndType(chain, type);
  }

  async updateNominatorMetadata (item: NominatorMetadata) {
    return this.stores.nominatorMetadata.upsert(item);
  }

  async getNominatorMetadata () {
    return this.stores.nominatorMetadata.getAll();
  }

  async resetWallet (resetAll: boolean): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const stores: BaseStore<unknown>[] = [
        this.stores.balance,
        this.stores.nft,
        this.stores.nftCollection,
        this.stores.crowdloan,
        this.stores.staking,
        this.stores.transaction,
        this.stores.nominatorMetadata
      ];

      if (resetAll) {
        stores.push(this.stores.chain, this.stores.asset);
      }

      const promises = stores.map((store) => store.clear());

      Promise.all(promises)
        .then(() => {
          resolve();
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  async setMantaPayData (data: any) {
    await this._db.mantaPay.put(data); // just override if exist
  }

  async updateMantaPayData (key: string, data: Record<string, any>) {
    await this._db.mantaPay.update(key, data); // just override if exist
  }

  async getMantaPayData (key: string) {
    return this._db.mantaPay.get({ key });
  }

  async deleteMantaPayConfig (key: string) {
    return this.stores.mantaPay.deleteRecord(key);
  }

  subscribeMantaPayConfig (chain: string, callback: (data: MantaPayConfig[]) => void) {
    this.stores.mantaPay.subscribeMantaPayConfig(chain).subscribe(({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      next: (data) => callback && callback(data)
    }));
  }

  async getMantaPayConfig (chain: string) {
    return this.stores.mantaPay.getConfig(chain);
  }

  async getMantaPayFirstConfig (chain: string) {
    return this.stores.mantaPay.getFirstConfig(chain);
  }

  async updateYieldPoolStore (data: YieldPoolInfo) {
    await this.stores.yieldPoolInfo.upsert(data);
  }

  async getYieldPools () {
    return this.stores.yieldPoolInfo.getAll();
  }

  subscribeYieldPoolInfo (chains: string[], callback: (data: YieldPoolInfo[]) => void) {
    this.stores.yieldPoolInfo.subscribeYieldPoolInfo(chains).subscribe(({
      next: (data) => callback && callback(data)
    }));
  }
}
