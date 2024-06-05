// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ResponseSign } from '@zondax/ledger-substrate/dist/common';

import { wrapBytes } from '@subwallet/extension-dapp';
import { PolkadotGenericApp } from '@zondax/ledger-substrate';

import { LEDGER_DEFAULT_ACCOUNT, LEDGER_DEFAULT_CHANGE, LEDGER_DEFAULT_INDEX, LEDGER_SUCCESS_CODE } from '@polkadot/hw-ledger/constants';
import { AccountOptions, LedgerAddress, LedgerSignature, LedgerVersion } from '@polkadot/hw-ledger/types';
import { transports } from '@polkadot/hw-ledger-transports';
import { hexAddPrefix, hexStripPrefix, u8aToHex } from '@polkadot/util';

import { BaseLedger } from './BaseLedger';

export async function loadWasm () {
  const imports = {}; // Omitted the contents since it's most likely irrelevant

  return await WebAssembly.instantiateStreaming(fetch('./metadata_shortener.wasm'), imports);
}

export class SubstrateGenericLedger extends BaseLedger<PolkadotGenericApp> {
  getVersion (): Promise<LedgerVersion> {
    return this.withApp(async (app): Promise<LedgerVersion> => {
      const { device_locked: locked, major, minor, patch, test_mode: testMode } = await app.getVersion();

      return {
        isLocked: locked,
        isTestMode: testMode,
        version: [major, minor, patch]
      };
    });
  }

  getAccountOption (accountOffset = 0, addressOffset = 0, accountOptions: Partial<AccountOptions> = {
    account: LEDGER_DEFAULT_ACCOUNT,
    addressIndex: LEDGER_DEFAULT_INDEX,
    change: LEDGER_DEFAULT_CHANGE
  }) {
    const account = (accountOptions?.account || 0) + (accountOffset || 0);
    const addressIndex = (accountOptions?.addressIndex || 0) + (addressOffset || 0);
    const change = accountOptions?.change || 0;

    return {
      account,
      change,
      addressIndex
    };
  }

  getAddress (confirm?: boolean, accountOffset?: number, addressOffset?: number, accountOptions?: Partial<AccountOptions>): Promise<LedgerAddress> {
    return this.withApp(async (app): Promise<LedgerAddress> => {
      const options = this.getAccountOption(accountOffset, addressOffset, accountOptions);

      const { address, pubKey } = await this.wrapError(app.getAddress(options.account, options.change, options.addressIndex, 42, false));

      return {
        address,
        publicKey: hexAddPrefix(pubKey)
      };
    });
  }

  async signTransaction (message: Uint8Array, metadata: Uint8Array, accountOffset?: number, addressOffset?: number, accountOptions?: Partial<AccountOptions>): Promise<LedgerSignature> {
    return this.withApp(async (app): Promise<LedgerSignature> => {
      const options = this.getAccountOption(accountOffset, addressOffset, accountOptions);
      const rs = await this.wrapError((app.signAdvanced(options.account, options.change, options.addressIndex, Buffer.from(message), Buffer.from(metadata))));

      return {
        signature: hexAddPrefix(u8aToHex(rs.signature))
      };
    });
  }

  async signMessage (message: Uint8Array, accountOffset?: number, addressOffset?: number, accountOptions?: Partial<AccountOptions>): Promise<LedgerSignature> {
    return this.withApp(async (app): Promise<LedgerSignature> => {
      const options = this.getAccountOption(accountOffset, addressOffset, accountOptions);

      const rs = await this.wrapError(app.signRaw(options.account, options.change, options.addressIndex, Buffer.from(wrapBytes(message))));

      const raw = hexStripPrefix(u8aToHex(rs.signature));
      const firstByte = raw.slice(0, 2);
      // Source: https://github.com/polkadot-js/common/blob/a82ebdf6f9d78791bd1f21cd3c534deee37e0840/packages/keyring/src/pair/index.ts#L29-L34
      const isExtraByte = firstByte === '00';
      // Remove first byte (signature_type) from signature
      const signature = isExtraByte ? hexAddPrefix(raw.slice(2)) : hexAddPrefix(raw);

      return {
        signature
      };
    });
  }

  getApp = async (): Promise<PolkadotGenericApp> => {
    if (!this.app) {
      const def = transports.find(({ type }) => type === this.transport);

      if (!def) {
        throw new Error(`Unable to find a transport for ${this.transport}`);
      }

      const transport = await def.create();

      this.app = PolkadotGenericApp.newApp(transport, '', '');
    }

    return this.app;
  };

  protected override wrapError = async<V> (promise: Promise<V>): Promise<V> => {
    try {
      const result = await promise as ResponseSign;

      if (!result.return_code) {
        return result as V;
      } else if (result.return_code === LEDGER_SUCCESS_CODE) {
        return result as V;
      } else {
        throw new Error(result.error_message);
      }
    } catch (e) {
      const error = e as Error;

      error.message = this.mappingError(error);

      throw error;
    }
  };

  mappingError (_error: Error): string {
    const error = _error.message;

    if (error.includes('28160')) {
      return 'App does not seem to be open';
    }

    if (error.includes('21781')) {
      return 'Locked device';
    }

    return error;
  }
}
