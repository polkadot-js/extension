// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BaseMigrationJob from '@subwallet/extension-base/koni/migration/Base';
import KoniDatabase from '@subwallet/extension-base/services/storage-service/databases';

export default class ResetTransactionHistoryEventIdx extends BaseMigrationJob {
  public override async run (): Promise<void> {
    const db = new KoniDatabase();

    const oldData = await db.transactions.toArray();

    await db.transactions.clear();
    await db.transactions.bulkAdd(oldData);
  }
}
