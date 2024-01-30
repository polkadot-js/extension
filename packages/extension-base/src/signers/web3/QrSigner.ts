// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExternalRequestPromise, ExternalRequestPromiseStatus } from '@subwallet/extension-base/background/KoniTypes';
import { QrState, Web3Transaction } from '@subwallet/extension-base/signers/types';
import { addHexPrefix } from 'ethereumjs-util';
import { ethers, TransactionLike } from 'ethers';

import { SignerResult } from '@polkadot/api/types';
import { HexString } from '@polkadot/util/types';

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
      const txObject: TransactionLike = {
        nonce: tx.nonce ?? 0,
        maxPriorityFeePerGas: addHexPrefix(tx.maxPriorityFeePerGas.toString(16)),
        maxFeePerGas: addHexPrefix(tx.maxFeePerGas.toString(16)),
        gasLimit: addHexPrefix(tx.gasLimit.toString(16)),
        to: tx.to !== undefined ? tx.to : '',
        value: addHexPrefix(tx.value.toString(16)),
        data: tx.data,
        chainId: tx.chainId
      };

      const qrPayload = ethers.Transaction.from(txObject).unsignedSerialized as HexString;

      const resolver = (result: SignerResult | PromiseLike<SignerResult>): void => {
        this.#resolver();
        resolve(result);
      };

      this.#setState({ reject: reject, resolve: resolver, status: ExternalRequestPromiseStatus.PENDING, createdAt: new Date().getTime() });

      this.#callback({
        qrState: {
          isQrHashed: false,
          qrAddress: tx.from,
          qrPayload: qrPayload,
          qrId: this.#id,
          isEthereum: true
        }
      });
    });
  }
}
