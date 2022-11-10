// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BalanceItem, CrowdloanItem, NftCollection, NftItem, StakingItem, TransactionHistoryItemType } from '@subwallet/extension-base/background/KoniTypes';
import Dexie, { Table, Transaction } from 'dexie';

const DEFAULT_DATABASE = 'SubWalletDB';

export interface DefaultDoc {
  chain: string,
  chainHash: string
}

export interface DefaultAddressDoc extends DefaultDoc {
  address: string
}

export interface INft extends Omit<NftItem, 'chain'>, DefaultAddressDoc {}
export interface INftCollection extends Omit<NftCollection, 'chain'>, DefaultDoc {}
export interface IBalance extends BalanceItem, DefaultAddressDoc {}
export interface ICrowdloanItem extends CrowdloanItem, DefaultAddressDoc {}
export interface IStakingItem extends StakingItem, DefaultAddressDoc {}
export interface ITransactionHistoryItem extends TransactionHistoryItemType, DefaultAddressDoc { }

export interface IMigration {
  key: string,
  name: string,
  timestamp: number
}

export default class KoniDatabase extends Dexie {
  public nfts!: Table<INft, object>;
  public nftCollections!: Table<INftCollection, object>;
  public balances!: Table<IBalance, object>;
  public crowdloans!: Table<ICrowdloanItem, object>;
  public stakings!: Table<IStakingItem, object>;
  public stakingsV2!: Table<IStakingItem, object>;
  public transactions!: Table<ITransactionHistoryItem, object>;
  public migrations!: Table<IMigration, object>;

  private schemaVersion: number;

  public constructor (name = DEFAULT_DATABASE, schemaVersion = 5) {
    super(name);
    this.schemaVersion = schemaVersion;

    this.conditionalVersion(1, {
      nfts: '[chainHash+collectionId+id+address], &[chainHash+collectionId+id+address], [address+chainHash], chainHash, chain, id, address, collectionId, name',
      nftCollections: '[chainHash+collectionId], &[chainHash+collectionId], chainHash, collectionId, collectionName',
      balances: '[chainHash+address], &[chainHash+address], chainHash, chain, address',
      crowdloans: '[chainHash+address], &[chainHash+address], chainHash, chain, address',
      stakings: '[chainHash+address], &[chainHash+address], chainHash, chain, address',
      transactions: '[chainHash+address+extrinsicHash+eventIdx], &[chainHash+address+extrinsicHash+eventIdx], chainHash, chain, address, extrinsicHash, eventIdx, action'
    });

    this.conditionalVersion(2, {
      migrations: '&[key+name]'
    });

    this.conditionalVersion(3, {
      nfts: '[chainHash+collectionId+id+address], &[chainHash+collectionId+id+address], [address+chainHash], [chainHash+collectionId], [chainHash+collectionId+address], chainHash, chain, id, address, collectionId, name'
    });

    this.conditionalVersion(4, {
      transactions: '[chainHash+address+extrinsicHash+eventIdx+action], &[chainHash+address+extrinsicHash+eventIdx+action], chainHash, chain, address, extrinsicHash, eventIdx, action'
    });

    this.conditionalVersion(5, {
      stakingsV2: '[chainHash+address+type], &[chainHash+address+type], [chainHash+address], chainHash, chain, address, type'
    });

    // this.conditionalVersion(4, {
    //   migrations2: '++_id, &[key+name]',
    //   nfts2: '++_id, &[chainHash+collectionId+id+address], [address+chainHash], [chainHash+collectionId], [chainHash+collectionId+address], chainHash, chain, id, address, collectionId, name',
    //   nftCollections2: '++_id, &[chainHash+collectionId], chainHash, collectionId, collectionName',
    //   balances2: '++_id, &[chainHash+address], chainHash, chain, address',
    //   crowdloans2: '++_id, &[chainHash+address], chainHash, chain, address',
    //   stakings2: '++_id, &[chainHash+address], chainHash, chain, address',
    //   transactions2: '++_id, &[chainHash+address+extrinsicHash+eventIdx], chainHash, chain, address, extrinsicHash, eventIdx, action'
    // }, async (tx: Transaction) => {
    //   await Promise.all([
    //     this.createIndexField(tx, 'migrations', 'migrations2'),
    //     this.createIndexField(tx, 'nfts', 'nfts2'),
    //     this.createIndexField(tx, 'nftCollections', 'nftCollections2'),
    //     this.createIndexField(tx, 'balances', 'balances2'),
    //     this.createIndexField(tx, 'crowdloans', 'crowdloans2'),
    //     this.createIndexField(tx, 'stakings', 'stakings2'),
    //     this.createIndexField(tx, 'transactions', 'transactions2')
    //   ]);
    // });

    // this.conditionalVersion(5, {
    //   migrations: null,
    //   nfts: null,
    //   nftCollections: null,
    //   balances: null,
    //   crowdloans: null,
    //   stakings: null,
    //   transactions: null
    // });

    // this.conditionalVersion(6, {
    //   migrations: '++_id, &[key+name]',
    //   nfts: '++_id, &[chainHash+collectionId+id+address], [address+chainHash], [chainHash+collectionId], [chainHash+collectionId+address], chainHash, chain, id, address, collectionId, name',
    //   nftCollections: '++_id, &[chainHash+collectionId], chainHash, collectionId, collectionName',
    //   balances: '++_id, &[chainHash+address], chainHash, chain, address',
    //   crowdloans: '++_id, &[chainHash+address], chainHash, chain, address',
    //   stakings: '++_id, &[chainHash+address], chainHash, chain, address',
    //   transactions: '++_id, &[chainHash+address+extrinsicHash+eventIdx], chainHash, chain, address, extrinsicHash, eventIdx, action'
    // }, async (tx: Transaction) => {
    //   await Promise.all([
    //     this.renameTable(tx, 'migrations2', 'migrations'),
    //     this.renameTable(tx, 'nfts2', 'nfts'),
    //     this.renameTable(tx, 'nftCollections2', 'nftCollections'),
    //     this.renameTable(tx, 'balances2', 'balances'),
    //     this.renameTable(tx, 'crowdloans2', 'crowdloans'),
    //     this.renameTable(tx, 'stakings2', 'stakings'),
    //     this.renameTable(tx, 'transactions2', 'transactions')
    //   ]);
    // });

    // Hooks
    // this.nftCollections.hook('creating', function (primKey, obj) {
    //   obj.collectionId = obj.collectionId.toLowerCase();
    // });

    // this.nftCollections.hook('updating', function (mods, primKey, obj) {
    //   obj.collectionId = obj.collectionId.toLowerCase();
    // });

    // this.nfts.hook('creating', function (primKey, obj) {
    //   obj.collectionId = obj.collectionId?.toLowerCase();
    // });

    // this.nfts.hook('updating', function (mods, primKey, obj) {
    //   obj.collectionId = obj.collectionId?.toLowerCase();
    // });
  }

  private conditionalVersion (
    version: number,
    schema: { [key: string]: string | null },
    upgrade?: (t: Transaction) => Promise<void>
  ) {
    if (this.schemaVersion != null && this.schemaVersion < version) {
      return;
    }

    const dexieVersion = this.version(version).stores(schema);

    if (upgrade != null) {
      dexieVersion.upgrade(upgrade);
    }
  }

  // private async createIndexField (tx: Transaction, tableName: string, tmpTable: string) {
  //   const table = tx.table(tableName);
  //   const tmp = tx.table(tmpTable);
  //   const oldRecords = await table.toArray();

  //   await table.clear();
  //   await tmp.bulkPut(oldRecords);
  //   // Remove old table.
  //   this.backendDB().deleteObjectStore(tableName);
  // }

  // private async renameTable (tx: Transaction, oldTableName: string, newTableName: string) {
  //   const oldTable = tx.table(oldTableName);
  //   const newTable = tx.table(newTableName);

  //   const oldRecords = await oldTable.toArray();

  //   await newTable.bulkPut(oldRecords);
  //   this.backendDB().deleteObjectStore(oldTableName);
  // }
}
