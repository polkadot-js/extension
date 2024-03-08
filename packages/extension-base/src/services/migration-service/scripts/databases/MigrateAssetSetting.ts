// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BaseMigrationJob from '@subwallet/extension-base/services/migration-service/Base';

export default class MigrateAssetSetting extends BaseMigrationJob {
  public override async run (): Promise<void> {
    try {
      const oldSlugs = [
        'ethereum-ERC20-WFTM-0x4E15361FD6b4BB609Fa63C81A2be19d873717870',
        'moonbeam-ERC20-CSG-0x2Dfc76901bB2ac2A5fA5fc479590A490BBB10a5F',
        'astar-LOCAL-aUSD',
        'astarEvm-ERC20-aUSD-0xfFFFFfFF00000000000000010000000000000001', //
        'moonriver-LOCAL-xcaUSD', //
        'moonriver-LOCAL-xckBTC',
        'bifrost-LOCAL-aUSD',
        'calamari-LOCAL-AUSD',
        'shiden-LOCAL-aUSD',
        'shidenEvm-ERC20-aUSD-0xfFFfFFfF00000000000000010000000000000000', //
        'ethereum_goerli-NATIVE-GoerliETH',
        'binance_test-NATIVE-BNB', //
        'pangolin-LOCAL-CKTON', //
        'zeta_test-NATIVE-aZETA' //
      ];
      const newSlug = [
        'ethereum-ERC20-FTM-0x4E15361FD6b4BB609Fa63C81A2be19d873717870',
        'moonbeam-ERC20-CGS-0x2Dfc76901bB2ac2A5fA5fc479590A490BBB10a5F',
        'astar-LOCAL-aSEED',
        'astarEvm-ERC20-aSEED-0xfFFFFfFF00000000000000010000000000000001',
        'moonriver-LOCAL-xcaSeed',
        'moonriver-LOCAL-xcKBTC',
        'bifrost-LOCAL-KUSD',
        'calamari-LOCAL-AUSD',
        'shiden-LOCAL-aSEED',
        'shidenEvm-ERC20-aSEED-0xfFFfFFfF00000000000000010000000000000000',
        'ethereum_goerli-NATIVE-ETH',
        'binance_test-NATIVE-tBNB',
        'pangolin-LOCAL-PKTON',
        'zeta_test-NATIVE-ZETA'
      ];
      const assetSetting = await this.state.chainService.getAssetSettings();

      for (const slug of oldSlugs) {

        if (Object.keys(assetSetting).includes(slug)) {
          const isVisible = assetSetting[slug].visible;

          // this.state.chainService.setAssetSettings({ slug: { visible: isVisible } });
        }
      }
    } catch (e) {
      console.error(e);
    }
  }
}
// chrome.storage.local.get(function(result){console.log(result)})
