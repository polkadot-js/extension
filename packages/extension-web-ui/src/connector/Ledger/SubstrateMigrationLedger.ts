// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PolkadotGenericApp } from '@zondax/ledger-substrate';

import { transports } from '@polkadot/hw-ledger-transports';

import { SubstrateGenericLedger } from './SubstrateGenericLedger';

export class SubstrateMigrationLedger extends SubstrateGenericLedger {
  override getApp = async (): Promise<PolkadotGenericApp> => {
    if (!this.app) {
      const def = transports.find(({ type }) => type === this.transport);

      if (!def) {
        throw new Error(`Unable to find a transport for ${this.transport}`);
      }

      const transport = await def.create();

      const slip = this.slip44 + 0x80000000;

      this.app = PolkadotGenericApp.newMigrationApp(transport, 0x90, slip, '', '');
    }

    return this.app;
  };
}
