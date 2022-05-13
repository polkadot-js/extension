// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TransferError } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson } from '@subwallet/extension-base/background/types';

import { Theme } from './components/themes';

export { Theme };

export interface ThemeProps {
  theme: Theme;
}

export interface Recoded {
  account: AccountJson | null;
  formatted: string | null;
  genesisHash?: string | null;
  prefix?: number;
  isEthereum: boolean;
}

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
  onTxUpdate?: (result: any) => void; // TODO: change any type when add logic
  onTxSuccess?: (result: any, extrinsicHash?: string) => void; // TODO: change any type when add logic
  onTxFail?: (result: any | null, error: Error | null, extrinsicHash?: string) => void; // TODO: change any type when add logic
}

export interface TxResult {
  isShowTxResult: boolean;
  isTxSuccess: boolean;
  txError?: Error | null;
  extrinsicHash?: string;
}

export interface TransferResultType {
  isShowTxResult: boolean;
  isTxSuccess: boolean;
  txError?: Array<TransferError>;
  extrinsicHash?: string;
}

export interface QrState {
  isQrHashed: boolean;
  qrAddress: string;
  qrPayload: Uint8Array;
  qrResolve?: (result: any) => void; // TODO: change any type when add logic
  qrReject?: (error: Error) => void;
}

export interface Signed {
  data: Uint8Array;
  message: Uint8Array;
  signature: Uint8Array;
}
