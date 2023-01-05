// Copyright 2017-2022 @polkadot/react-signer authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Signer, SignerResult } from '@polkadot/api/types';
import type { Registry, SignerPayloadJSON } from '@polkadot/types/types';

import { KeyringPair } from '@subwallet/keyring/types';

interface KeyringSignerProps {
  registry: Registry;
  keyPair: KeyringPair;
}

let id = 1;

export default class KeyringSigner implements Signer {
  readonly #pair: KeyringPair;
  readonly #registry: Registry;

  constructor ({ keyPair, registry }: KeyringSignerProps) {
    this.#pair = keyPair;
    this.#registry = registry;
  }

  public async signPayload (payload: SignerPayloadJSON): Promise<SignerResult> {
    return new Promise((resolve) => {
      const wrapper = this.#registry.createType('ExtrinsicPayload', payload, { version: payload.version });

      const signature = wrapper.sign(this.#pair).signature;

      resolve({
        id: id++,
        signature: signature
      });
    });
  }
}
