// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _AssetType } from '@subwallet/chain-list/types';
import BaseMigrationJob from '@subwallet/extension-base/services/migration-service/Base';

export default class MigrateNetworkSettings extends BaseMigrationJob {
  public override async run (): Promise<void> {
    const state = this.state;

    const items = await new Promise<{NetworkMap: unknown}>((resolve) => {
      chrome.storage.local.get('NetworkMap', (items) => {
        resolve(items as {NetworkMap: unknown});
      });
    });
    const oldNetworkMap = items.NetworkMap as Record<string, { active: boolean, currentProvider: string }>;
    const enableList: string[] = [];
    const stateMap = state.getChainStateMap();

    if (!oldNetworkMap) {
      return;
    }

    Object.entries(oldNetworkMap).forEach(([slug, chain]) => {
      if (chain.active) {
        const currentState = stateMap[slug];

        // Ensure chain in the list and is not active
        (currentState) && enableList.push(slug);
      }
    });

    if (enableList.length > 0) {
      await state.chainService.enableChains(enableList);

      // Enable native token of these chains
      const currentAssetSettings = await state.chainService.getAssetSettings();
      const assetInfoMap = state.chainService.getAssetRegistry();

      Object.entries(assetInfoMap).forEach(([slug, assetInfo]) => {
        const assetSetting = currentAssetSettings[slug] || {};

        // Enable native token of these chains
        if (assetInfo.name && assetInfo.assetType === _AssetType.NATIVE && enableList.includes(assetInfo.originChain) && !assetSetting.visible) {
          currentAssetSettings[slug] = { visible: true };
        }
      });

      state.chainService.setAssetSettings({ ...currentAssetSettings });
    }
  }
}
