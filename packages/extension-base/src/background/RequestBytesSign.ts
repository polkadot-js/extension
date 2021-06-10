// Copyright 2019-2021 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { KeyringPair } from '@polkadot/keyring/types';
import type { SignerPayloadRaw } from '@polkadot/types/types';
import type { RequestSign } from './types';

import { TypeRegistry } from '@polkadot/types';
import { hexToU8a, stringToU8a, u8aConcat, u8aEq, u8aToHex } from '@polkadot/util';

const PREFIX = stringToU8a('<RawBytes>');
const POSTFIX = stringToU8a('</RawBytes>');
const WRAP_LEN = PREFIX.length + POSTFIX.length;

export default class RequestBytesSign implements RequestSign {
  public readonly payload: SignerPayloadRaw;

  constructor (payload: SignerPayloadRaw) {
    this.payload = payload;
  }

  sign (_registry: TypeRegistry, pair: KeyringPair): { signature: string } {
    const rawBytes = hexToU8a(this.payload.data);
    const hasWrapper = rawBytes.length <= WRAP_LEN &&
      u8aEq(rawBytes.subarray(0, PREFIX.length), PREFIX) &&
      u8aEq(rawBytes.slice(-POSTFIX.length), POSTFIX);

    return {
      signature: u8aToHex(
        pair.sign(
          hasWrapper
            ? rawBytes
            : u8aConcat(PREFIX, rawBytes, POSTFIX)
        )
      )
    };
  }
}
