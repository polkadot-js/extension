// Copyright 2017-2022 @polkadot/react-signer authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Signer, SignerResult } from '@polkadot/api/types';
import type { Registry, SignerPayloadJSON } from '@polkadot/types/types';

import { KeyringPair } from '@polkadot/keyring/types';
import { hexStripPrefix, u8aToHex } from '@polkadot/util';
import { blake2AsU8a } from '@polkadot/util-crypto';

interface KeyringSignerProps {
  registry: Registry;
  keyPair: KeyringPair;
}

export default class KeyringSigner implements Signer {
  readonly #pair: KeyringPair;
  readonly #registry: Registry;

  constructor ({ keyPair, registry }: KeyringSignerProps) {
    this.#pair = keyPair;
    this.#registry = registry;
  }

  public async signPayload (payload: SignerPayloadJSON): Promise<SignerResult> {
    return new Promise((resolve): void => {
      // limit size of the transaction
      const isQrHashed = (payload.method.length > 5000);
      const wrapper = this.#registry.createType('ExtrinsicPayload', payload);
      const qrPayload = isQrHashed
        ? blake2AsU8a(wrapper.toU8a(true))
        : wrapper.toU8a();

      // New version - valid
      const _wrapper = this.#registry.createType('ExtrinsicPayload', qrPayload);
      const _signature = _wrapper.sign(this.#pair).signature;

      console.log(_signature);

      // Old version - invalid
      const signed = this.#pair.sign(u8aToHex(qrPayload));
      const signature: `0x${string}` = `0x01${hexStripPrefix(u8aToHex(signed))}`;

      console.log(signature);

      resolve({
        id: 1,
        signature: _signature
      });
    });
  }
}
