// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { BalanceItem, CrowdloanItem, ExtraDelegationInfo, NftCollection, NftItem, StakingItem, TransactionHistoryItemType } from '@subwallet/extension-base/background/KoniTypes';
import Dexie, { Table, Transaction } from 'dexie';

const DEFAULT_DATABASE = 'SubWalletDB_v2';

export interface DefaultDoc {
  chain: string
}

export interface DefaultAddressDoc extends DefaultDoc {
  address: string
}

// TODO: refactor this
export interface INft extends Omit<NftItem, 'chain'>, DefaultAddressDoc {}
export interface INftCollection extends Omit<NftCollection, 'chain'>, DefaultDoc {}
export interface IBalance extends BalanceItem, DefaultAddressDoc {}
export interface ICrowdloanItem extends CrowdloanItem, DefaultAddressDoc {}
export interface IStakingItem extends StakingItem, DefaultAddressDoc {}
export interface ITransactionHistoryItem extends TransactionHistoryItemType, DefaultAddressDoc {}
export interface IExtraDelegationInfo extends ExtraDelegationInfo, DefaultAddressDoc {}
export interface IChain extends _ChainInfo {
  active: boolean,
  currentProvider: string
}

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
  public extraDelegationInfo!: Table<IExtraDelegationInfo, object>;
  public chain!: Table<IChain, object>;
  public asset!: Table<_ChainAsset, object>;

  private schemaVersion: number;

  public constructor (name = DEFAULT_DATABASE, schemaVersion = 7) {
    super(name);
    this.schemaVersion = schemaVersion;

    this.conditionalVersion(1, {
      // DO NOT declare all columns, only declare properties to be indexed
      // Read more: https://dexie.org/docs/Version/Version.stores()
      // Primary key is always the first entry
      chain: 'slug',
      asset: 'slug',
      nfts: '[chain+collectionId+id+address], [address+chain], chain, id, address, collectionId, name',
      nftCollections: '[chain+collectionId], chain, collectionId, collectionName',
      balances: '[tokenId+address], tokenId, address, originChain',
      crowdloans: '[chain+address], chain, address',
      stakings: '[chain+address+type], [chain+address], chainHash, chain, address, type',
      transactions: '[chain+address+extrinsicHash], &[chain+address+extrinsicHash], chain, address, extrinsicHash, action',
      extraDelegationInfo: '[chain+address], &[chain+address], address'
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
