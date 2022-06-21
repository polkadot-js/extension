// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

export interface QrState {
  isQrHashed: boolean;
  qrAddress: string;
  qrPayload: `0x${string}`;
  qrId: string;
  isEthereum: boolean;
}

export interface Web3TransactionBase {
  to: string;
  gasPrice: number;
  gasLimit: number;
  nonce: number;
  chainId: number;
  data: string;
  value: number;
}

export interface Web3Transaction extends Web3TransactionBase{
  from: string;
}
