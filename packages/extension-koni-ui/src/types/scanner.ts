// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@subwallet/extension-koni-base/utils/eth';

import { GenericExtrinsicPayload } from '@polkadot/types';

export interface Frames {
  completedFramesCount: number;
  isMultipart: boolean;
  missedFrames: number[];
  missingFramesMessage: string;
  totalFramesCount: number;
}

export interface TxRequestData {
  type: string;
  rawData: string;
  data: string;
  target?: number;
}

export type ParsedData = SubstrateParsedData | EthereumParsedData | NetworkParsedData;

export interface NetworkParsedData {
  action: 'addNetwork';
  data: {
    color: string;
    decimals: number;
    genesisHash: string;
    prefix: number;
    title: string;
    unit: string;
  };
}

export interface EthereumParsedData {
  data: {
    data: string;
    account: string;
    rlp: string;
  };
  isHash: boolean;
  action: string | null; // "signTransaction"
}

export type SubstrateParsedData = SubstrateMultiParsedData | SubstrateCompletedParsedData;

export type CompletedParsedData = SubstrateCompletedParsedData | EthereumParsedData;

export type SubstrateCompletedParsedData = SubstrateTransactionParsedData | SubstrateMessageParsedData;

export interface SubstrateTransactionParsedData {
  data: {
    account: string;
    crypto: 'ed25519' | 'sr25519' | null;
    data: Uint8Array;
    genesisHash: string;
    specVersion?: number;
    rawPayload?: Uint8Array;
  };
  action: 'signTransaction';
  oversized: boolean;
  isHash: false;
}

export interface SubstrateMessageParsedData {
  data: {
    account: string;
    crypto: 'ed25519' | 'sr25519' | null;
    data: string;
    genesisHash: string;
    specVersion?: number;
    rawPayload?: string;
  };
  action: 'signData';
  oversized: boolean;
  isHash: true;
}

export interface SubstrateMultiParsedData {
  currentFrame: number;
  frameCount: number;
  isMultipart: boolean;
  partData: string;
}

export interface SURIObject {
  derivePath: string;
  password: string;
  phrase: string;
}

export interface MessageQRInfo {
  dataToSign: string;
  isHash: boolean;
  isOversized: boolean;
  message: string;
  senderAddress: string;
  type: 'message';
}

export interface TxQRInfo {
  senderAddress: string;
  recipientAddress: string;
  type: 'transaction';
  dataToSign: string | Uint8Array;
  isHash: boolean;
  isOversized: boolean;
  tx: Transaction | GenericExtrinsicPayload | string | Uint8Array;
}

export interface MultiFramesInfo {
  missedFrames: number[];
  completedFramesCount: number;
  totalFrameCount: number;
}

export type QrInfo = MessageQRInfo | TxQRInfo;
