// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExternalRequestPromise, ExternalRequestPromiseStatus } from '@subwallet/extension-base/background/KoniTypes';
import { QrState, Web3Transaction } from '@subwallet/extension-base/signers/types';
import RLP, { Input } from 'rlp';

import { SignerResult } from '@polkadot/api/types';
import { u8aToHex } from '@polkadot/util';

interface CallbackProps {
  qrState: QrState
}

interface QrSignerProps {
  callback: (state: CallbackProps) => void;
  id: string;
  setState: (promise: ExternalRequestPromise) => void;
  resolver: () => void;
}

export default class QrSigner {
  readonly #callback: (state: CallbackProps) => void;
  readonly #id: string;
  readonly #resolver: () => void;
  readonly #setState: (promise: ExternalRequestPromise) => void;

  constructor ({ callback, id, resolver, setState }: QrSignerProps) {
    this.#callback = callback;
    this.#id = id;
    this.#resolver = resolver;
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

      const resolver = (result: SignerResult | PromiseLike<SignerResult>): void => {
        this.#resolver();
        resolve(result);
      };

      this.#setState({ reject: reject, resolve: resolver, status: ExternalRequestPromiseStatus.PENDING, createdAt: new Date().getTime() });

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
