// Copyright 2017-2022 @polkadot/react-signer authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Signer, SignerResult } from '@polkadot/api/types';
import type { Registry, SignerPayloadJSON } from '@polkadot/types/types';

import { ExternalRequestPromise, ExternalRequestPromiseStatus } from '@subwallet/extension-base/background/KoniTypes';
import { QrState } from '@subwallet/extension-base/signers/types';

import { u8aToHex } from '@polkadot/util';
import { blake2AsU8a } from '@polkadot/util-crypto';

interface CallbackProps {
  qrState: QrState
}

interface QrSignerProps {
  registry: Registry;
  callback: (state: CallbackProps) => void;
  id: string;
  setState: (promise: ExternalRequestPromise) => void;
  resolver: () => void;
}

export default class QrSigner implements Signer {
  readonly #callback: (state: CallbackProps) => void;
  readonly #id: string;
  readonly #registry: Registry;
  readonly #resolver: () => void;
  readonly #setState: (promise: ExternalRequestPromise) => void;

  constructor ({ callback, id, registry, resolver, setState }: QrSignerProps) {
    this.#callback = callback;
    this.#id = id;
    this.#registry = registry;
    this.#resolver = resolver;
    this.#setState = setState;
  }

  public async signPayload (payload: SignerPayloadJSON): Promise<SignerResult> {
    return new Promise((resolve, reject): void => {
      // limit size of the transaction
      const isQrHashed = (payload.method.length > 5000);
      const wrapper = this.#registry.createType('ExtrinsicPayload', payload, { version: payload.version });
      const qrPayload = isQrHashed
        ? blake2AsU8a(wrapper.toU8a(true))
        : wrapper.toU8a();

      const resolver = (result: SignerResult | PromiseLike<SignerResult>): void => {
        this.#resolver();
        resolve(result);
      };

      this.#setState({ reject: reject, resolve: resolver, status: ExternalRequestPromiseStatus.PENDING, createdAt: new Date().getTime() });

      this.#callback({
        qrState: {
          isQrHashed,
          qrAddress: payload.address,
          qrPayload: u8aToHex(qrPayload),
          qrId: this.#id,
          isEthereum: false
        }
      });
    });
  }
}
