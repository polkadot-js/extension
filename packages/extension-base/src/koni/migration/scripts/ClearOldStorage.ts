// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BaseMigrationJob from '@subwallet/extension-base/koni/migration/Base';

export default class ClearOldStorage extends BaseMigrationJob {
  public override async run (): Promise<void> {
    // new BalanceStore().removeAll();
    // new CrowdloanStore().removeAll();
    // new StakingStore().removeAll();
    // new NftStore().removeAll();
    // new NftCollectionStore().removeAll();
    // // Todo: clear transaction history data

    return Promise.resolve();
  }
}
