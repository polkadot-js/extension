// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BaseMigrationJob from '@subwallet/extension-base/services/migration-service/Base';

export default class ReloadMetadata extends BaseMigrationJob {
  protected chains: string[] = ['goldberg_testnet'];

  public override async run (): Promise<void> {
    const activeChains = this.state.chainService.getActiveChains();

    for (const chain of this.chains) {
      const item = await this.state.dbService.stores.metadata.getMetadata(chain);

      if (item) {
        // @ts-ignore
        await this.state.dbService.stores.metadata.remove(item.genesisHash);

        const isActive = activeChains.includes(chain);

        if (isActive) {
          this.state.chainService.disableChain(chain);

          setTimeout(() => {
            this.state.chainService.enableChain(chain).catch(console.error);
          }, 500);
        }
      }
    }
    // Clear all old metadata data

    return Promise.resolve();
  }
}
