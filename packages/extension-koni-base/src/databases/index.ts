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
  public transactions!: Table<ITransactionHistoryItem, object>;
  public migrations!: Table<IMigration, object>;

  private schemaVersion: number;

  public constructor (name = DEFAULT_DATABASE, schemaVersion = 3) {
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
}
