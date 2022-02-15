// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SubmittableResult } from '@polkadot/api';
import { SignerResult } from '@polkadot/api/types';

export interface AddressFlags {
  accountOffset: number;
  addressOffset: number;
  hardwareType?: string;
  isHardware: boolean;
  isMultisig: boolean;
  isProxied: boolean;
  isQr: boolean;
  isUnlockable: boolean;
  threshold: number;
  who: string[];
}

export interface AddressProxy {
  isUnlockCached: boolean;
  signAddress: string | null;
  signPassword: string;
}

export interface TxHandler {
  onTxStart?: () => void;
  onTxUpdate?: (result: SubmittableResult) => void;
  onTxSuccess?: (result: SubmittableResult, extrinsicHash?: string) => void;
  onTxFail?: (result: SubmittableResult | null, error: Error | null, extrinsicHash?: string) => void;
}

export interface TxResult {
  isShowTxResult: boolean;
  isTxSuccess: boolean;
  txError?: Error | null;
  extrinsicHash?: string;
}

export interface QrState {
  isQrHashed: boolean;
  qrAddress: string;
  qrPayload: Uint8Array;
  qrResolve?: (result: SignerResult) => void;
  qrReject?: (error: Error) => void;
}

export interface Signed {
  data: Uint8Array;
  message: Uint8Array;
  signature: Uint8Array;
}
