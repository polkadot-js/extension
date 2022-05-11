"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
// Copyright 2019-2022 @polkadot/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0
// External to class, this.# is not private enough (yet)
let sendRequest;
let nextId = 0;

class Signer {
  constructor(_sendRequest) {
    sendRequest = _sendRequest;
  }

  async signPayload(payload) {
    const id = ++nextId;
    const result = await sendRequest('pub(extrinsic.sign)', payload); // we add an internal id (number) - should have a mapping from the
    // extension id (string) -> internal id (number) if we wish to provide
    // updated via the update functionality (noop at this point)

    return { ...result,
      id
    };
  }

  async signRaw(payload) {
    const id = ++nextId;
    const result = await sendRequest('pub(bytes.sign)', payload);
    return { ...result,
      id
    };
  } // NOTE We don't listen to updates at all, if we do we can interpret the
  // resuklt as provided by the API here
  // public update (id: number, status: Hash | SubmittableResult): void {
  //   // ignore
  // }


}

exports.default = Signer;