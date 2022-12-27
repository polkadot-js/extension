// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import KoniDatabase from '@subwallet/extension-koni-base/databases';
import BaseMigrationJob from '@subwallet/extension-koni-base/migration/Base';

export default class ResetTransactionHistoryEventIdx extends BaseMigrationJob {
  public override async run (): Promise<void> {
    const db = new KoniDatabase();

    const oldData = await db.transactions.toArray();

    oldData.forEach((transaction) => {
      transaction.eventIdx = 0;
    });

    await db.transactions.clear();
    await db.transactions.bulkAdd(oldData);
  }
}
