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
  to?: string;
  gasPrice: number;
  maxFeePerGas: number;
  maxPriorityFeePerGas: number;
  gasLimit: number;
  nonce: number;
  chainId: number;
  data?: string;
  value: number;
}

export interface Web3Transaction extends Web3TransactionBase {
  from: string;
}

export interface LedgerState {
  ledgerPayload: `0x${string}`;
  ledgerId: string;
}

export interface ExternalState {
  externalId: string;
}

export enum SignerType {
  PASSWORD = 'PASSWORD',
  QR = 'QR',
  LEDGER = 'LEDGER',
}

export type SignerExternal = SignerType.LEDGER | SignerType.QR;
