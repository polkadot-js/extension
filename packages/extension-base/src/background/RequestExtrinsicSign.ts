// Copyright 2019-2022 @subwallet/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { KeyringPair } from '@polkadot/keyring/types';
import type { SignerPayloadJSON } from '@polkadot/types/types';
import type { HexString } from '@polkadot/util/types';
import type { RequestSign } from './types';

import { TypeRegistry } from '@polkadot/types';

export default class RequestExtrinsicSign implements RequestSign {
  public readonly payload: SignerPayloadJSON;

  constructor (payload: SignerPayloadJSON) {
    this.payload = payload;
  }

  sign (registry: TypeRegistry, pair: KeyringPair): { signature: HexString } {
    return registry
      .createType('ExtrinsicPayload', this.payload, { version: this.payload.version })
      .sign(pair);
  }
}
