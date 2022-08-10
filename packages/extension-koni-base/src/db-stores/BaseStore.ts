// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Table } from 'dexie';

import { logger as createLogger } from '@polkadot/util';
import { Logger } from '@polkadot/util/types';

import { DefaultDoc } from '../databases';

export default class BaseStore<T extends DefaultDoc> {
  private _table: Table<T, unknown>;
  private logger: Logger;
  constructor (table: Table<T, unknown>) {
    this._table = table;
    this.logger = createLogger(this.constructor.name);
  }

  public get table () {
    return this._table;
  }

  public upsert (record: T) {
    return this.table.put(record);
  }

  public remove (record: T) {
    return this.table.delete(record);
  }
}
