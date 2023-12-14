// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BaseMigrationJob from '@subwallet/extension-base/services/migration-service/Base';

/**
 * @description Enable `newTokens` if `oldToken` active
 * */
export default abstract class MigrateToken extends BaseMigrationJob {
  abstract oldToken: string;
  abstract newTokens: string[];

  public override async run (): Promise<void> {
    const state = this.state;

    const assetSettings = await state.chainService.getAssetSettings();
    const oldAssetSetting = assetSettings[this.oldToken];

    if (oldAssetSetting) {
      if (oldAssetSetting.visible) {
        for (const newToken of this.newTokens) {
          assetSettings[newToken] = { visible: true };
        }
      }

      delete assetSettings[this.oldToken];

      state.chainService.setAssetSettings(assetSettings);
    }
  }
}
