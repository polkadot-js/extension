// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BalanceItem, BalanceJson } from '@subwallet/extension-base/background/KoniTypes';

import { logger as createLogger } from '@polkadot/util';
import { Logger } from '@polkadot/util/types';

import KoniDatabase from '../databases';
import { BalanceStore, CrowdloanStore, NftCollectionStore, NftStore, StakingStore } from '../db-stores';

export default class DatabaseService {
  private _db: KoniDatabase;
  public stores;
  private logger: Logger;

  constructor () {
    this.logger = createLogger('DB-Service');
    this._db = new KoniDatabase();
    this.stores = {
      balance: new BalanceStore(this._db.balances),
      nft: new NftStore(this._db.nfts),
      nftCollection: new NftCollectionStore(this._db.nftCollections),
      crowdloan: new CrowdloanStore(this._db.crowdloans),
      staking: new StakingStore(this._db.stakings)
    };
  }

  async getNftByAddress (address: string) {
    const res = await this._db.nfts.where('address').equals(address).toArray();

    return res;
  }

  // Balance
  async addBalance (chain: string, chainHash: string, address: string, balance: BalanceItem) {
    this.logger.log(`Updating balance [${chain}]`);

    return this.stores.balance.upsert({ chainHash, chain, address, ...balance });
  }

  public getBalanceObservable (address: string, cb: (result: BalanceJson) => void) {
    return this.stores.balance.liveQueryBalance(address, cb);
  }

  public getBalance (address: string) {
    return this.stores.balance.getBalance(address);
  }
}
