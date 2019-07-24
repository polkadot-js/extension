// Copyright 2019 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { Signer as SignerInterface, SignerPayload, SignerResult } from '@polkadot/api/types';
import { SendRequest } from './types';

let sendRequest: SendRequest;
let nextId = 0;

export default class Signer implements SignerInterface {
  public constructor (_sendRequest: SendRequest) {
    sendRequest = _sendRequest;
  }

  public async signPayload (payload: SignerPayload): Promise<SignerResult> {
    const id = ++nextId;
    const result = await sendRequest('extrinsic.sign', payload);

    // we add an internal id (number) - should have a mapping from the
    // extension id (string) -> internal id (number) if we wish to provide
    // updated via the update functionality (noop at this point)
    return {
      ...result,
      id
    };
  }

  // We don't listen to updates at all, if we do we can interpret the result
  // as provided by the API here
  // public update (id: number, status: Hash | SubmittableResult): void {
  //   // ignore
  // }
}
