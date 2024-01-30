// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Ledger } from '@subwallet/extension-web-ui/types';

import { Ledger as ZondaxLedger } from '@polkadot/hw-ledger';
import { AccountOptions, LedgerSignature } from '@polkadot/hw-ledger/types';

export class SubstrateLedger extends ZondaxLedger implements Ledger {
  signTransaction (message: Uint8Array, accountOffset?: number, addressOffset?: number, accountOptions?: Partial<AccountOptions>): Promise<LedgerSignature> {
    return super.sign(message, accountOffset, addressOffset, accountOptions);
  }

  signMessage (message: Uint8Array, accountOffset?: number, addressOffset?: number, accountOptions?: Partial<AccountOptions>): Promise<LedgerSignature> {
    throw new Error('You are using a Ledger - Substrate account. Sign message is not supported with this account type');
  }

  disconnect (): Promise<void> {
    return super.withApp(async (app) => {
      await app.transport.close();
    });
  }
}
