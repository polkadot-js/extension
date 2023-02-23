// Copyright 2017-2022 @polkadot/react-signer authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Signer, SignerResult } from '@polkadot/api/types';
import type { SignerPayloadJSON } from '@polkadot/types/types';

import { ResponseSigning } from '@subwallet/extension-base/background/types';
import { SWTransaction } from '@subwallet/extension-base/services/transaction-service/types';

interface KeyringSignerProps {
  transaction: SWTransaction;
}

let id = 1;

export default class ExtensionSigner implements Signer {
  readonly #transaction: SWTransaction;

  constructor ({ transaction }: KeyringSignerProps) {
    this.#transaction = transaction;
  }

  public async signPayload (payload: SignerPayloadJSON): Promise<SignerResult> {
    return new Promise((resolve, reject) => {
      this.#transaction.payload = payload;

      this.#transaction.resolve = (result: ResponseSigning) => {
        resolve({
          id: id++,
          signature: result.signature
        });
      };

      this.#transaction.reject = reject;
      this.#transaction.convertToRequest?.();
    });
  }
}
