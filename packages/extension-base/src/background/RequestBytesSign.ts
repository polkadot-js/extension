// Copyright 2019-2020 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { KeyringPair } from '@polkadot/keyring/types';
import type { SignerPayloadRaw } from '@polkadot/types/types';
import type { RequestSign } from './types';

import { u8aToHex, hexToU8a } from '@polkadot/util';
import { TypeRegistry } from '@polkadot/types';

export default class RequestBytesSign implements RequestSign {
  public readonly payload: SignerPayloadRaw;

  constructor (payload: SignerPayloadRaw) {
    this.payload = payload;
  }

  sign (_registry: TypeRegistry, pair: KeyringPair): { signature: string } {
    return {
      signature: u8aToHex(
        pair.sign(
          hexToU8a(this.payload.data)
        )
      )
    };
  }
}
