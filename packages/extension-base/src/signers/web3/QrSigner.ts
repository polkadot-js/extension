// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { QRRequestPromise, QRRequestPromiseStatus } from '@subwallet/extension-base/background/KoniTypes';
import { QrState, Web3Transaction } from '@subwallet/extension-base/signers/types';
import RLP, { Input } from 'rlp';

import { SignerResult } from '@polkadot/api/types';
import { u8aToHex } from '@polkadot/util';

interface CallbackProps {
  qrState: QrState
}

export default class QrSigner {
  readonly #callback: (state: CallbackProps) => void;
  readonly #setState: (promise: QRRequestPromise) => void;
  readonly #id: string;

  constructor (callback: (state: CallbackProps) => void, id: string, setState: (promise: QRRequestPromise) => void) {
    this.#callback = callback;
    this.#id = id;

    this.#setState = setState;
  }

  public async signTransaction (tx: Web3Transaction): Promise<SignerResult> {
    return new Promise((resolve, reject): void => {
      const data: Input = [
        tx.nonce,
        tx.gasPrice,
        tx.gasLimit,
        tx.to,
        tx.value,
        tx.data,
        tx.chainId,
        new Uint8Array([0x00]),
        new Uint8Array([0x00])
      ];

      const qrPayload = RLP.encode(data);

      this.#setState({ reject: reject, resolve: resolve, status: QRRequestPromiseStatus.PENDING, createdAt: new Date().getTime() });

      this.#callback({
        qrState: {
          isQrHashed: false,
          qrAddress: tx.from,
          qrPayload: u8aToHex(qrPayload),
          qrId: this.#id,
          isEthereum: true
        }
      });
    });
  }
}
