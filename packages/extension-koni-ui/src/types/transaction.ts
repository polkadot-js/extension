// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

export class Transaction {
  readonly nonce: string;
  readonly gasPrice: string;
  readonly gas: string;
  readonly action: string;
  readonly value: string;
  readonly data: string;
  readonly ethereumChainId: string;
  readonly isSafe: boolean;

  constructor (nonce: string,
    gasPrice: string,
    gas: string,
    action: string,
    value: string,
    data: string,
    ethereumChainId: string) {
    this.nonce = nonce || '0';
    this.gasPrice = parseInt(gasPrice, 16).toString();
    this.gas = parseInt(gas, 16).toString();
    this.action = action;
    this.value = value;
    this.data = data || '-';
    this.ethereumChainId = parseInt(ethereumChainId, 16).toString();
    this.isSafe = true;
  }
}
