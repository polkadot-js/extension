// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BaseMigrationJob from '@subwallet/extension-base/services/migration-service/Base';

export default class MigrateRemoveGenesisHash extends BaseMigrationJob {
  public override async run (): Promise<void> {
    try {
      return new Promise((resolve) => {
        try {
          this.state.keyringService.removeNoneHardwareGenesisHash();
        } catch (e) {
          console.error(e);
        }

        resolve();
      });
    } catch (e) {
      console.error(e);
    }
  }
}
