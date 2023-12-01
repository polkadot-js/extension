// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BaseMigrationJob from '@subwallet/extension-base/services/migration-service/Base';

import MigrateGeneralProvider, { MigrateProviderTarget } from './MigrateGeneralProvider';

export default abstract class MigrateProviders extends BaseMigrationJob {
  abstract targets: MigrateProviderTarget[];

  public override async run (): Promise<void> {
    const scripts = this.targets.map((target) => {
      return new MigrateGeneralProvider(this.state, target).run();
    });

    await Promise.all(scripts);
  }
}
