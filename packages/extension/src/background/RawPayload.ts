// Copyright 2017-2019 @polkadot/types authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { KeyringPair } from '@polkadot/keyring/types';

import { ExtrinsicEra, Hash, IndexCompact, Struct, U8a } from '@polkadot/types';
import { blake2AsU8a } from '@polkadot/util-crypto';

// This is a copy of the signing in @polkadot/types with the method as a pure U8a
// (without metadata, we cannot reliably parse the Method when we don not have
// the actual chain metadata - this is for offline, non-connected signing)
export default class SignaturePayloadRaw extends Struct {
  protected _signature?: Uint8Array;

  constructor (value?: any) {
    super({
      nonce: IndexCompact,
      method: U8a,
      era: ExtrinsicEra,
      blockHash: Hash
    }, value);
  }

  /**
   * @description Sign the payload with the keypair
   */
  sign (signerPair: KeyringPair): Uint8Array {
    const u8a = this.toU8a();
    const encoded = u8a.length > 256
      ? blake2AsU8a(u8a)
      : u8a;

    this._signature = signerPair.sign(encoded);

    return this._signature;
  }
}
