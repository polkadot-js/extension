// Copyright 2019-2020 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { KeyringPair } from '@polkadot/keyring/types';
import { SignerPayloadJSON, SignerPayloadRaw } from '@polkadot/types/types';
import { RequestSign } from './types';

import { TypeRegistry } from '@polkadot/types';

export default class RequestExtrinsicSign implements RequestSign {
  public readonly inner: SignerPayloadJSON | SignerPayloadRaw;

  constructor (inner: SignerPayloadJSON) {
    this.inner = inner;
  }

  sign (registry: TypeRegistry, pair: KeyringPair): { signature: string } {
    const inner = this.inner as SignerPayloadJSON;
    const extrinsic = registry.createType('ExtrinsicPayload', this.inner, { version: inner.version });

    return extrinsic.sign(pair);
  }
}
