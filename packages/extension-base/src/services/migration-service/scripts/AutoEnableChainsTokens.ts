// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BaseMigrationJob from '@subwallet/extension-base/services/migration-service/Base';
import { keyring } from '@subwallet/ui-keyring';

export default class AutoEnableChainsTokens extends BaseMigrationJob {
  public override async run (): Promise<void> {
    const accounts = keyring.getAccounts();

    await this.state.balanceService.autoEnableChains(accounts.map(({ address }) => address));
  }
}
