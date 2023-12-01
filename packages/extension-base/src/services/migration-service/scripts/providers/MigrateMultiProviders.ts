// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BaseMigrationJob from '@subwallet/extension-base/services/migration-service/Base';

import MigrateGeneralProvider, { MigrateProviderTarget } from './MigrateGeneralProvider';

export default abstract class MigrateMultiProviders extends BaseMigrationJob {
  abstract targets: MigrateProviderTarget[];

  public override async run (): Promise<void> {
    for (const target of this.targets) {
      const migration = new MigrateGeneralProvider(this.state, target);

      await migration.run();
    }
  }
}
