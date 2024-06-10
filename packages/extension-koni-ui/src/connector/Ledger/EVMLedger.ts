// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AccountOptions, LedgerAddress, LedgerSignature, LedgerVersion } from '@polkadot/hw-ledger/types';

import EthApp from '@ledgerhq/hw-app-eth';
import { Ledger, LedgerTypes } from '@subwallet/extension-koni-ui/types';

import { transports } from '@polkadot/hw-ledger-transports';
import { hexStripPrefix, u8aToHex } from '@polkadot/util';

export class EVMLedger extends Ledger {
  #app: EthApp | null = null;
  // readonly #chainId: number;
  readonly #transport: LedgerTypes;

  constructor (transport: LedgerTypes) {
    super();

    // u2f is deprecated
    if (!['hid', 'webusb'].includes(transport)) {
      throw new Error(`Unsupported transport ${transport}`);
    }

    // this.#chainId = chainId;
    this.#transport = transport;
  }

  getAddress (confirm?: boolean, accountOffset?: number, addressOffset?: number, accountOptions?: Partial<AccountOptions>): Promise<LedgerAddress> {
    return this.withApp(async (app): Promise<LedgerAddress> => {
      const path = this.#serializePath(accountOffset, addressOffset, accountOptions);

      const { address, publicKey } = await this.#wrapError(app.getAddress(path, confirm));

      return {
        address,
        publicKey: `0x${publicKey}`
      };
    });
  }

  getVersion (): Promise<LedgerVersion> {
    return this.withApp(async (app): Promise<LedgerVersion> => {
      const { version } = await this.#wrapError(app.getAppConfiguration());

      const [_major, _minor, _patch] = version.split('.');

      const major = parseInt(_major);
      const minor = parseInt(_minor);
      const patch = parseInt(_patch);

      return {
        isLocked: false,
        isTestMode: false,
        version: [major, minor, patch]
      };
    });
  }

  async signTransaction (message: Uint8Array, accountOffset = 0, addressOffset = 0, accountOptions: AccountOptions): Promise<LedgerSignature> {
    return this.withApp(async (app): Promise<LedgerSignature> => {
      const hex = hexStripPrefix(u8aToHex(message));
      const path = this.#serializePath(accountOffset, addressOffset, accountOptions);

      const { r, s, v } = await this.#wrapError(app.signTransaction(path, hex));

      const hexR = r.length % 2 === 1 ? `0${r}` : r;
      const hexS = s.length % 2 === 1 ? `0${s}` : s;
      const hexV = v.length % 2 === 1 ? `0${v}` : v;

      return {
        signature: `0x${hexR + hexS + hexV}`
      };
    });
  }

  async signMessage (message: Uint8Array, accountOffset = 0, addressOffset = 0, accountOptions: AccountOptions): Promise<LedgerSignature> {
    return this.withApp(async (app): Promise<LedgerSignature> => {
      const hex = hexStripPrefix(u8aToHex(message));
      const path = this.#serializePath(accountOffset, addressOffset, accountOptions);

      const { r, s, v } = await this.#wrapError(app.signPersonalMessage(path, hex));

      const hexR = r.length % 2 === 1 ? `0${r}` : r;
      const hexS = s.length % 2 === 1 ? `0${s}` : s;
      const vString = v.toString(16);
      const hexV = vString.length % 2 === 1 ? `0${vString}` : vString;

      return {
        signature: `0x${hexR + hexS + hexV}`
      };
    });
  }

  #serializePath (accountOffset = 0, addressOffset = 0, accountOptions?: Partial<AccountOptions>): string {
    const account = (accountOptions?.account || 0) + (accountOffset || 0);
    const addressIndex = (accountOptions?.addressIndex || 0) + (addressOffset || 0);
    const change = accountOptions?.change || 0;

    return `44'/60'/${account}'/${change}/${addressIndex}`;
  }

  #getApp = async (): Promise<EthApp> => {
    if (!this.#app) {
      const def = transports.find(({ type }) => type === this.#transport);

      if (!def) {
        throw new Error(`Unable to find a transport for ${this.#transport}`);
      }

      const transport = await def.create();

      this.#app = new EthApp(transport);
    }

    return this.#app;
  };

  withApp = async<T> (fn: (_app: EthApp) => Promise<T>): Promise<T> => {
    try {
      const app = await this.#getApp();

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return await fn(app);
    } catch (error) {
      this.#app = null;
      throw error;
    }
  };

  #wrapError = async<T> (promise: Promise<T>): Promise<T> => {
    try {
      return await promise;
    } catch (e) {
      throw Error(mappingError((e as Error).message));
    }
  };

  override disconnect (): Promise<void> {
    return this.withApp(async (app) => {
      await app.transport.close();
    });
  }
}

const mappingError = (error: string): string => {
  if (error.includes('(0x6511)')) {
    return 'App does not seem to be open';
  }

  if (error.includes('(0x6985)')) {
    return 'User rejected';
  }

  if (error.includes('(0x6b0c)')) {
    return 'Your ledger is locked';
  }

  return error;
};
