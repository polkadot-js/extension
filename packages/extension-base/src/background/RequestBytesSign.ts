// Copyright 2019-2025 @polkadot/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { KeyringPair } from '@polkadot/keyring/types';
import type { TypeRegistry } from '@polkadot/types';
import type { SignerPayloadRaw } from '@polkadot/types/types';
import type { HexString } from '@polkadot/util/types';
import type { RequestSign } from './types.js';

import { u8aToHex, u8aWrapBytes } from '@polkadot/util';

export default class RequestBytesSign implements RequestSign {
  public readonly payload: SignerPayloadRaw;

  constructor (payload: SignerPayloadRaw) {
    this.payload = payload;
  }

  sign (_registry: TypeRegistry, pair: KeyringPair): { signature: HexString } {
    return {
      signature: u8aToHex(
        pair.sign(
          u8aWrapBytes(this.payload.data)
        )
      )
    };
  }
}
