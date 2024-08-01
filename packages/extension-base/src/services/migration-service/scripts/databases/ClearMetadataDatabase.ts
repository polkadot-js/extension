// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import BaseMigrationJob from '@subwallet/extension-base/services/migration-service/Base';
import { cacheMetadata, waitTimeout } from '@subwallet/extension-base/utils';

export default class ClearMetadataDatabase extends BaseMigrationJob {
  public override async run (): Promise<void> {
    // Clear all old metadata data
    await this.state.dbService.stores.metadata.clear();

    const activeChains = this.state.chainService.getActiveChains();

    const chainInfoMap = this.state.chainService.getChainInfoMap();

    const reloadChains = activeChains.filter((chain) => !!chainInfoMap[chain].substrateInfo?.genesisHash);

    for (const chain of reloadChains) {
      const substrateApi = this.state.chainService.getSubstrateApi(chain);

      const callback = (substrateApi: _SubstrateApi) => {
        cacheMetadata(chain, substrateApi, this.state.chainService);
      };

      Promise.race([substrateApi.isReady, waitTimeout(2000)])
        .finally(() => {
          substrateApi?.connect(callback);
        });
    }

    return Promise.resolve();
  }
}
