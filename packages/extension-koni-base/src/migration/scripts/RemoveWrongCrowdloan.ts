// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import KoniDatabase from '@subwallet/extension-base/services/storage-service/databases';
import BaseMigrationJob from '@subwallet/extension-koni-base/migration/Base';

export default class RemoveWrongCrowdloan extends BaseMigrationJob {
  public override async run (): Promise<void> {
    const db = new KoniDatabase();

    const deleteKeys: Array<any> = [];

    await db.crowdloans.each(({ chainHash }, { primaryKey }) => {
      if (chainHash.endsWith('_evm')) {
        deleteKeys.push(primaryKey);
      }
    });

    deleteKeys.forEach((pKey) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      db.crowdloans.delete(pKey).catch(console.debug);
    });
  }
}
