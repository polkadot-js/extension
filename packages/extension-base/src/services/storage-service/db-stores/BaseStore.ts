// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Table } from 'dexie';

import { logger as createLogger } from '@polkadot/util';
import { Logger } from '@polkadot/util/types';

export default class BaseStore<T> {
  private _table: Table<T, unknown>;
  public logger: Logger;
  constructor (table: Table<T, unknown>) {
    this._table = table;
    this.logger = createLogger(this.constructor.name);
  }

  public get table () {
    return this._table;
  }

  public upsert (record: T): Promise<unknown> {
    return this.table.put(record);
  }

  public bulkUpsert (records: T[]): Promise<unknown> {
    return this.table.bulkPut(records);
  }

  /**
   * @todo Must update, delete function need the key not the record
   * */
  public remove (record: T): Promise<void> {
    return this.table.delete(record);
  }

  public clear (): Promise<void> {
    return this.table.clear();
  }
}
