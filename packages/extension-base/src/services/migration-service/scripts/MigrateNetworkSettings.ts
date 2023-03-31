// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BaseMigrationJob from '@subwallet/extension-base/services/migration-service/Base';

export default class MigrateNetworkSettings extends BaseMigrationJob {
  public override async run (): Promise<void> {
    const state = this.state;

    return new Promise((resolve, reject) => {
      chrome.storage.local.get('NetworkMap', function (items) {
        if (items && items.NetworkMap) {
          const networkMap = items.NetworkMap as Record<string, { active: boolean, currentProvider: string }>;
          const enableList: string[] = [];
          const stateMap = state.getChainStateMap();

          Object.entries(networkMap).forEach(([slug, chain]) => {
            if (chain.active) {
              const currentState = stateMap[slug];

              // Ensure chain in the list and is not active
              (currentState && !currentState.active) && enableList.push(slug);
            }
          });

          if (enableList.length > 0) {
            state.chainService.enableChains(enableList);
          }
        }

        resolve();
      });
    });
  }
}
