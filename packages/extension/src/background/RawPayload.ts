// Copyright 2017-2019 @polkadot/types authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { KeyringPair } from '@polkadot/keyring/types';

import { ExtrinsicEra, Hash, IndexCompact, Struct, U8a } from '@polkadot/types';
import { blake2AsU8a } from '@polkadot/util-crypto';

// This is a copy of the signing in @polkadot/types with the method as a pure U8a
// (without metadata, we cannot reliably parse the Method, hence faling)
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
   * @description `true` if the payload refers to a valid signature
   */
  get isSigned (): boolean {
    return !!(this._signature && this._signature.length === 64);
  }

  /**
   * @description The block [[Hash]] the signature applies to (mortal/immortal)
   */
  get blockHash (): Hash {
    return this.get('blockHash') as Hash;
  }

  /**
   * @description The [[Method]] contained in the payload
   */
  get method (): U8a {
    return this.get('method') as U8a;
  }

  /**
   * @description The [[ExtrinsicEra]]
   */
  get era (): ExtrinsicEra {
    return this.get('era') as ExtrinsicEra;
  }

  /**
   * @description The [[IndexCompact]]
   */
  get nonce (): IndexCompact {
    return this.get('nonce') as IndexCompact;
  }

  /**
   * @description The raw signature as a `Uint8Array`
   */
  get signature (): Uint8Array {
    if (!this.isSigned) {
      throw new Error('Transaction is not signed');
    }

    return this._signature as Uint8Array;
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
