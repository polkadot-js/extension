// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BaseMigrationJob from '@subwallet/extension-base/services/migration-service/Base';

import uiSettings from '@polkadot/ui-settings';

export default class MigrateSettings extends BaseMigrationJob {
  public override async run (): Promise<void> {
    try {
      return new Promise((resolve) => {
        this.state.settingService.getSettings((currentSettings) => {
          const isAccessCamera = uiSettings.camera === 'on';

          this.state.settingService.setSettings({
            ...currentSettings,
            camera: isAccessCamera
          });

          resolve();
        });
      });
    } catch (e) {
      console.error(e);
    }
  }
}
