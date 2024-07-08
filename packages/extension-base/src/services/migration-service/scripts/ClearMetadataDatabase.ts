// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BaseMigrationJob from '@subwallet/extension-base/services/migration-service/Base';

export default class ClearMetadataDatabase extends BaseMigrationJob {
  public override async run (): Promise<void> {
    // Clear all old metadata data
    await this.state.dbService.stores.metadata.clear();

    return Promise.resolve();
  }
}
