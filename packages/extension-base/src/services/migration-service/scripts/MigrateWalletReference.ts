// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BaseMigrationJob from '@subwallet/extension-base/services/migration-service/Base';
import { v4 as uuidv4 } from 'uuid';

export default class MigrateWalletReference extends BaseMigrationJob {
  public override async run (): Promise<void> {
    try {
      return new Promise((resolve) => {
        this.state.settingService.getSettings((currentSettings) => {
          const walletReference = uuidv4();

          this.state.settingService.setSettings({
            ...currentSettings,
            walletReference: walletReference
          });

          resolve();
        });
      });
    } catch (e) {
      console.error(e);
    }
  }
}
