// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AssetSetting } from '@subwallet/extension-base/background/KoniTypes';
import BaseMigrationJob from '@subwallet/extension-base/services/migration-service/Base';

export default class MigrateAssetSetting extends BaseMigrationJob {
  public override async run (): Promise<void> {
    try {
      const changeSlugsMap: Record<string, string> = {
        'ethereum-ERC20-WFTM-0x4E15361FD6b4BB609Fa63C81A2be19d873717870': 'ethereum-ERC20-FTM-0x4E15361FD6b4BB609Fa63C81A2be19d873717870',
        'moonbeam-ERC20-CSG-0x2Dfc76901bB2ac2A5fA5fc479590A490BBB10a5F': 'moonbeam-ERC20-CGS-0x2Dfc76901bB2ac2A5fA5fc479590A490BBB10a5F',
        'astar-LOCAL-aUSD': 'astar-LOCAL-aSEED',
        'astarEvm-ERC20-aUSD-0xfFFFFfFF00000000000000010000000000000001': 'astarEvm-ERC20-aSEED-0xfFFFFfFF00000000000000010000000000000001',
        'moonriver-LOCAL-xcaUSD': 'moonriver-LOCAL-xcaSeed',
        'moonriver-LOCAL-xckBTC': 'moonriver-LOCAL-xcKBTC',
        'bifrost-LOCAL-aUSD': 'bifrost-LOCAL-KUSD',
        'calamari-LOCAL-aUSD': 'calamari-LOCAL-AUSD',
        'shiden-LOCAL-aUSD': 'shiden-LOCAL-aSEED',
        'shidenEvm-ERC20-aUSD-0xfFFfFFfF00000000000000010000000000000000': 'shidenEvm-ERC20-aSEED-0xfFFfFFfF00000000000000010000000000000000',
        'ethereum_goerli-NATIVE-GoerliETH': 'ethereum_goerli-NATIVE-ETH',
        'binance_test-NATIVE-BNB': 'binance_test-NATIVE-tBNB',
        'pangolin-LOCAL-CKTON': 'pangolin-LOCAL-PKTON',
        'zeta_test-NATIVE-aZETA': 'zeta_test-NATIVE-ZETA',
        'origintrail-NATIVE-OTP': 'origintrail-NATIVE-NEURO',
        'moonbeam-LOCAL-xciBTC': 'moonbeam-LOCAL-xcIBTC',
        'tomochain-NATIVE-TOMO': 'tomochain-NATIVE-VIC'
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
