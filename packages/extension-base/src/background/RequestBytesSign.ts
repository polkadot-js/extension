// Copyright 2019-2021 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { KeyringPair } from '@polkadot/keyring/types';
import type { SignerPayloadRaw } from '@polkadot/types/types';
import type { HexString } from '@polkadot/util/types';
import type { RequestSign } from './types';

import { wrapBytes } from '@polkadot/extension-dapp/wrapBytes';
import { TypeRegistry } from '@polkadot/types';
import { u8aToHex } from '@polkadot/util';

export default class RequestBytesSign implements RequestSign {
  public readonly payload: SignerPayloadRaw;

  constructor (payload: SignerPayloadRaw) {
    this.payload = payload;
  }

  sign (_registry: TypeRegistry, pair: KeyringPair): { signature: HexString } {
    return {
      signature: u8aToHex(
        pair.sign(
          wrapBytes(this.payload.data)
        )
      )
    };
  }
}
