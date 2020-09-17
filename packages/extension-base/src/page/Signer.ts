// Copyright 2019-2020 @polkadot/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Signer as SignerInterface, SignerResult } from '@polkadot/api/types';
import { SignerPayloadJSON, SignerPayloadRaw } from '@polkadot/types/types';
import { SendRequest } from './types';

// External to class, this.# is not private enough (yet)
let sendRequest: SendRequest;
let nextId = 0;

export default class Signer implements SignerInterface {
  constructor (_sendRequest: SendRequest) {
    sendRequest = _sendRequest;
  }

  public async signPayload (payload: SignerPayloadJSON): Promise<SignerResult> {
    const id = ++nextId;
    const result = await sendRequest('pub(extrinsic.sign)', payload);

    // we add an internal id (number) - should have a mapping from the
    // extension id (string) -> internal id (number) if we wish to provide
    // updated via the update functionality (noop at this point)
    return {
      ...result,
      id
    };
  }

  public async signRaw (payload: SignerPayloadRaw): Promise<SignerResult> {
    const id = ++nextId;
    const result = await sendRequest('pub(bytes.sign)', payload);

    return {
      ...result,
      id
    };
  }

  // NOTE We don't listen to updates at all, if we do we can interpret the
  // resuklt as provided by the API here
  // public update (id: number, status: Hash | SubmittableResult): void {
  //   // ignore
  // }
}
