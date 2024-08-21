// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AssetSetting } from '@subwallet/extension-base/background/KoniTypes';
import BaseMigrationJob from '@subwallet/extension-base/services/migration-service/Base';

export default class MigrateAssetSetting extends BaseMigrationJob {
  public override async run (): Promise<void> {
    try {
      const changeSlugsMap: Record<string, string> = {
        'bobMainnet-LOCAL-wBTC-0x03C7054BCB39f7b2e5B2c7AcB37583e32D70Cfa3': 'bobMainnet-LOCAL-WBTC-0x03C7054BCB39f7b2e5B2c7AcB37583e32D70Cfa3',
        'hydradx_main-LOCAL-LRNA': 'hydradx_main-LOCAL-H2O'
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
