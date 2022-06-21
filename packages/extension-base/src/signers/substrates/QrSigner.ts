// Copyright 2017-2022 @polkadot/react-signer authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Signer, SignerResult } from '@polkadot/api/types';
import type { Registry, SignerPayloadJSON } from '@polkadot/types/types';

import { QRRequestPromise, QRRequestPromiseStatus, ResponseTransferQr, TransferStep } from '@subwallet/extension-base/background/KoniTypes';

import { u8aToHex } from '@polkadot/util';
import { blake2AsU8a } from '@polkadot/util-crypto';

export default class QrSigner implements Signer {
  readonly #registry: Registry;
  readonly #callback: (state: ResponseTransferQr) => void;
  readonly #setState: (promise: QRRequestPromise) => void;
  readonly #id: string;

  constructor (registry: Registry, callback: (state: ResponseTransferQr) => void, id: string, setState: (promise: QRRequestPromise) => void) {
    this.#registry = registry;
    this.#callback = callback;
    this.#id = id;

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

      this.#setState({ reject: reject, resolve: resolve, status: QRRequestPromiseStatus.PENDING, createdAt: new Date().getTime() });

      this.#callback({
        step: TransferStep.READY,
        errors: [],
        extrinsicStatus: undefined,
        data: {},
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
