// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Signer, SignerResult } from '@polkadot/api/types';
import type { Registry, SignerPayloadJSON } from '@polkadot/types/types';

import { ExternalRequestPromise, ExternalRequestPromiseStatus } from '@subwallet/extension-base/background/KoniTypes';
import { LedgerState } from '@subwallet/extension-base/signers/types';

import { u8aToHex } from '@polkadot/util';

interface CallbackProps {
  ledgerState: LedgerState
}

export default class LedgerSigner implements Signer {
  readonly #registry: Registry;
  readonly #callback: (state: CallbackProps) => void;
  readonly #setState: (promise: ExternalRequestPromise) => void;
  readonly #id: string;

  constructor (registry: Registry, callback: (state: CallbackProps) => void, id: string, setState: (promise: ExternalRequestPromise) => void) {
    this.#registry = registry;
    this.#callback = callback;
    this.#id = id;

    this.#setState = setState;
  }

  public async signPayload (payload: SignerPayloadJSON): Promise<SignerResult> {
    return new Promise((resolve, reject): void => {
      const raw = this.#registry.createType('ExtrinsicPayload', payload, { version: payload.version });
      const ledgerPayload = raw.toU8a(true);

      this.#setState({ reject: reject, resolve: resolve, status: ExternalRequestPromiseStatus.PENDING, createdAt: new Date().getTime() });

      this.#callback({
        ledgerState: {
          ledgerPayload: u8aToHex(ledgerPayload),
          ledgerId: this.#id
        }
      });
    });
  }
}
