// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BaseMigrationJob from '@subwallet/extension-base/services/migration-service/Base';
import Dexie from 'dexie';

export default class DeleteChain extends BaseMigrationJob {
  public override async run (): Promise<void> {
    const db = new Dexie('SubWalletDB_v2');
    const dexieDB = await db.open();
    const transactionTable = dexieDB.table('chain');

    await transactionTable.bulkDelete(['snow', 'snow_evm', 'arctic_testnet']);
  }
}
