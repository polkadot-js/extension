// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AssetSetting } from '@subwallet/extension-base/background/KoniTypes';
import BaseMigrationJob from '@subwallet/extension-base/services/migration-service/Base';

export default class AutoEnableSomeTokens extends BaseMigrationJob {
  public override async run (): Promise<void> {
    try {
      const slugs = ['statemint-NATIVE-DOT', 'statemint-LOCAL-DED', 'statemint-LOCAL-PINK', 'moonbeam-LOCAL-xcDOT', 'moonbeam-LOCAL-xcPINK'];

      const assetSetting = await this.state.chainService.getAssetSettings();

      const migratedAssetSetting: Record<string, AssetSetting> = {};

      for (const slug of slugs) {
        if (Object.keys(assetSetting).includes(slug)) {
          migratedAssetSetting[slug] = { visible: true };
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
