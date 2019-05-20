// Copyright 2019 @polkadot/extension-inject authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { SignatureOptions } from '@polkadot/types/types';
import { Signer as ISigner, SendRequest } from './types';

import { Extrinsic, Hash } from '@polkadot/types';
import { SubmittableResult } from '@polkadot/api/SubmittableExtrinsic';

let sendRequest: SendRequest;

export default class Signer implements ISigner {
  constructor (_sendRequest: SendRequest) {
    sendRequest = _sendRequest;
  }

  async sign (extrinsic: Extrinsic, address: string, { blockHash, nonce }: SignatureOptions): Promise<number> {
    // Bit of a hack - with this round-about way, we skip any keyring deps
    const cleaned = JSON.parse(JSON.stringify({
      address,
      blockHash,
      method: extrinsic.method.toHex(),
      nonce
    }));

    const { id, signature } = await sendRequest('extrinsic.sign', cleaned);

    extrinsic.addSignature(address as any, signature, nonce);

    return id;
  }

  update (id: number, status: Hash | SubmittableResult): void {
    // something
  }
}
