// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BaseMigrationJob from '@subwallet/extension-koni-base/migration/Base';
import BalanceStore from '@subwallet/extension-koni-base/stores/Balance';
import CrowdloanStore from '@subwallet/extension-koni-base/stores/Crowdloan';
import NftStore from '@subwallet/extension-koni-base/stores/Nft';
import NftCollectionStore from '@subwallet/extension-koni-base/stores/NftCollection';
import StakingStore from '@subwallet/extension-koni-base/stores/Staking';

export default class ClearOldStorage extends BaseMigrationJob {
  public override async run (): Promise<void> {
    new BalanceStore().removeAll();
    new CrowdloanStore().removeAll();
    new StakingStore().removeAll();
    new NftStore().removeAll();
    new NftCollectionStore().removeAll();
    // Todo: clear transaction history data

    return Promise.resolve();
  }
}
