// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Ledger } from '@subwallet/extension-koni-ui/types';

import { Ledger as ZondaxLedger } from '@polkadot/hw-ledger';
import { AccountOptions, LedgerSignature } from '@polkadot/hw-ledger/types';
import { hexAddPrefix, hexStripPrefix } from '@polkadot/util';

export class SubstrateLegacyLedger extends ZondaxLedger implements Ledger {
  signTransaction (message: Uint8Array, metadata: Uint8Array, accountOffset?: number, addressOffset?: number, accountOptions?: Partial<AccountOptions>): Promise<LedgerSignature> {
    return super.sign(message, accountOffset, addressOffset, accountOptions);
  }

  async signMessage (message: Uint8Array, accountOffset?: number, addressOffset?: number, accountOptions?: Partial<AccountOptions>): Promise<LedgerSignature> {
    const rs = await super.signRaw(message, accountOffset, addressOffset, accountOptions);

    const raw = hexStripPrefix(rs.signature);
    const firstByte = raw.slice(0, 2);
    // Source: https://github.com/polkadot-js/common/blob/a82ebdf6f9d78791bd1f21cd3c534deee37e0840/packages/keyring/src/pair/index.ts#L29-L34
    const isExtraByte = firstByte === '00';
    // Remove first byte (signature_type) from signature
    const signature = isExtraByte ? hexAddPrefix(raw.slice(2)) : hexAddPrefix(raw);

    return {
      signature
    };
  }

  disconnect (): Promise<void> {
    return super.withApp(async (app) => {
      await app.transport.close();
    });
  }
}
