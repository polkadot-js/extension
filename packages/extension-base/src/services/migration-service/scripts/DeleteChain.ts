// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BaseMigrationJob from '@subwallet/extension-base/services/migration-service/Base';

export default class DeleteChain extends BaseMigrationJob {
  // eslint-disable-next-line @typescript-eslint/require-await
  public override async run (): Promise<void> {
    ['snow', 'snow_evm', 'arctic_testnet'].forEach((chain) => {
      this.state.forceRemoveChain(chain);
    });

    console.log('done job');
  }
}
