// Copyright 2019 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { SignerOptions } from '@polkadot/api/types';
import { InjectedSigner } from '@polkadot/extension-dapp/types';
import { IExtrinsic } from '@polkadot/types/types';
import { SendRequest } from './types';

import { Hash } from '@polkadot/types';
import { SubmittableResult } from '@polkadot/api/SubmittableExtrinsic';

let sendRequest: SendRequest;

export default class Signer implements InjectedSigner {
  public constructor (_sendRequest: SendRequest) {
    sendRequest = _sendRequest;
  }

  public async sign (extrinsic: IExtrinsic, address: string, { blockHash, blockNumber, era, genesisHash, nonce }: SignerOptions): Promise<number> {
    // Bit of a hack - with this round-about way, we skip any keyring deps
    const { id, signature } = await sendRequest('extrinsic.sign', JSON.parse(JSON.stringify({
      address,
      blockHash,
      blockNumber: blockNumber.toNumber(),
      era,
      genesisHash,
      method: extrinsic.method.toHex(),
      nonce
    })));

    extrinsic.addSignature(address, signature, nonce);

    return id;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public update (id: number, status: Hash | SubmittableResult): void {
    // something
  }
}
