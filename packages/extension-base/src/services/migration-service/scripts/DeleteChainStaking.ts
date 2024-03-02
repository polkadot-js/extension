// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BaseMigrationJob from '@subwallet/extension-base/services/migration-service/Base';

export default class DeleteChainStaking extends BaseMigrationJob {
  public override async run (): Promise<void> {
    try {
      await this.state.dbService.stores.yieldPoolInfo.table.where({ slug: 'CAPS___native_staking___ternoa_alphanet' }).delete();
    } catch (e) {
      console.error(e);
    }
  }
}
