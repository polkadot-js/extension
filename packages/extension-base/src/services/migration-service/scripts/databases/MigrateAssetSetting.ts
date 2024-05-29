// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AssetSetting } from '@subwallet/extension-base/background/KoniTypes';
import BaseMigrationJob from '@subwallet/extension-base/services/migration-service/Base';

export default class MigrateAssetSetting extends BaseMigrationJob {
  public override async run (): Promise<void> {
    try {
      const changeSlugsMap: Record<string, string> = {
        'commune-NATIVE-C': 'commune-NATIVE-COMAI'
      };

      const assetSetting = await this.state.chainService.getAssetSettings();

      const migratedAssetSetting: Record<string, AssetSetting> = {};

      for (const [oldSlug, newSlug] of Object.entries(changeSlugsMap)) {
        if (Object.keys(assetSetting).includes(oldSlug)) {
          const isVisible = assetSetting[oldSlug].visible;

          migratedAssetSetting[newSlug] = { visible: isVisible };
        }
      }

      this.state.chainService.setAssetSettings({
        ...assetSetting,
        ...migratedAssetSetting
      });
    } catch (e) {
      console.error(e);
    }
  }
}
