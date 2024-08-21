// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { LedgerTypes } from '@subwallet/extension-koni-ui/types';

import { SubstrateGenericLedger } from './SubstrateGenericLedger';

export class SubstrateMigrationLedger extends SubstrateGenericLedger {
  constructor (transport: LedgerTypes, slip44: number, ss58AddrType?: number) {
    super(transport, slip44);

    if (ss58AddrType) {
      this.ss58_addr_type = ss58AddrType;
    }
  }
}
