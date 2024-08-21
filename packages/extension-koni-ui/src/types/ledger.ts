// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountOptions, LedgerAddress, LedgerSignature, LedgerVersion } from '@polkadot/hw-ledger/types';

export type LedgerTypes = 'hid' | 'webusb';

export abstract class Ledger {
  abstract getAddress (confirm?: boolean, accountOffset?: number, addressOffset?: number, accountOptions?: Partial<AccountOptions>): Promise<LedgerAddress>;

  abstract getVersion (): Promise<LedgerVersion>;

  abstract signTransaction (message: Uint8Array, metadata: Uint8Array, accountOffset?: number, addressOffset?: number, accountOptions?: Partial<AccountOptions>): Promise<LedgerSignature>;
  abstract signMessage (message: Uint8Array, accountOffset?: number, addressOffset?: number, accountOptions?: Partial<AccountOptions>): Promise<LedgerSignature>;
  abstract disconnect (): Promise<void>;
}

export type LedgerErrorStatus = 'warning' | 'error';

export interface ConvertLedgerError {
  status: LedgerErrorStatus;
  message: string;
}

export type SignTransactionLedger = (message: Uint8Array, metadata: Uint8Array, accountOffset?: number, addressOffset?: number, address?: string, accountOptions?: Partial<AccountOptions>) => Promise<LedgerSignature>;
export type SignMessageLedger = (message: Uint8Array, accountOffset?: number, addressOffset?: number, address?: string, accountOptions?: Partial<AccountOptions>) => Promise<LedgerSignature>;
