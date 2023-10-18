// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BaseMigrationJob from '@subwallet/extension-base/services/migration-service/Base';

export default class DeleteEarningData extends BaseMigrationJob {
  public override async run (): Promise<void> {
    try {
      await this.state.dbService.deleteYieldPoolInfo(['LcDOT___acala_euphrates_liquid_staking', 'xcDOT___moonwell_lending']);
    } catch (e) {
      console.error(e);
    }
  }
}
