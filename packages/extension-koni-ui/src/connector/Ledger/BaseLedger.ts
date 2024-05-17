// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type Transport from '@ledgerhq/hw-transport';

import { Ledger, LedgerTypes } from '@subwallet/extension-koni-ui/types';

interface LedgerApp {
  transport: Transport;
}

export abstract class BaseLedger<T extends LedgerApp> extends Ledger {
  protected app: T | null = null;
  // readonly #chainId: number;
  readonly transport: LedgerTypes;

  constructor (transport: LedgerTypes) {
    super();

    // u2f is deprecated
    if (!['hid', 'webusb'].includes(transport)) {
      throw new Error(`Unsupported transport ${transport}`);
    }

    // this.#chainId = chainId;
    this.transport = transport;
  }

  protected abstract getApp(): Promise<T>

  protected withApp = async<V> (fn: (_app: T) => Promise<V>): Promise<V> => {
    try {
      const app = await this.getApp();

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return await fn(app);
    } catch (error) {
      this.app = null;
      throw error;
    }
  };

  protected wrapError = async<V> (promise: Promise<V>): Promise<V> => {
    try {
      return await promise;
    } catch (e) {
      const error = e as Error;

      error.message = this.mappingError(error);

      throw error;
    }
  };

  disconnect (): Promise<void> {
    return this.withApp(async (app) => {
      await app.transport.close();
    });
  }

  abstract mappingError (error: Error): string;
}
