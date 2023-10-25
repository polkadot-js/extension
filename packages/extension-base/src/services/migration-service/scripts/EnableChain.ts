// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BaseMigrationJob from '@subwallet/extension-base/services/migration-service/Base';

export default abstract class EnableChain extends BaseMigrationJob {
  abstract slug: string;

  public override async run (): Promise<void> {
    const state = this.state;

    await state.enableChain(this.slug, true);
  }
}
