// Copyright 2019-2020 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import keyring from '@polkadot/ui-keyring';
import ExtensionStore from '@polkadot/ui-keyring/stores/Extension';
import { cryptoWaitReady } from '@polkadot/util-crypto';

import Extension from './Extension';
import State from './State';

describe('Extension', () => {
  async function createExtension (): Promise<Extension> {
    await cryptoWaitReady();
    keyring.loadAll({ store: new ExtensionStore() });
    return new Extension(new State());
  }
  let extension: Extension;

  beforeAll(async () => {
    extension = await createExtension();
  });

  const suri = 'seed sock milk update focus rotate barely fade car face mechanic mercy';
  const password = 'passw0rd';

  test('exports account from keyring', async () => {
    const { pair: { address } } = keyring.addUri(suri, password);
    const result = await extension.handle('id', 'pri(accounts.export)', {
      address,
      password
    }, {} as chrome.runtime.Port);

    expect(result.exportedJson).toContain(address);
    expect(result.exportedJson).toContain('"encoded"');
  });

  describe('account derivation', () => {
    const createAccount = async (): Promise<string> => {
      await extension.handle('id', 'pri(accounts.create.suri)', {
        name: 'parent',
        password,
        suri
      }, {} as chrome.runtime.Port);
      const { address } = await extension.handle('id', 'pri(seed.validate)', {
        suri
      }, {} as chrome.runtime.Port);
      return address;
    };
    let address: string;

    beforeEach(async () => {
      address = await createAccount();
    });

    test('pri(derivation.validate) passes for valid suri', async () => {
      const result = await extension.handle('id', 'pri(derivation.validate)', {
        parentAddress: address,
        suri: '//path',
        parentPassword: password
      }, {} as chrome.runtime.Port);
      expect(result).toStrictEqual({
        address: '5FP3TT3EruYBNh8YM8yoxsreMx7uZv1J1zNX7fFhoC5enwmN',
        suri: '//path'
      });
    });

    test('pri(derivation.validate) throws for invalid suri', async () => {
      await expect(extension.handle('id', 'pri(derivation.validate)', {
        parentAddress: address,
        suri: 'invalid-path',
        parentPassword: password
      }, {} as chrome.runtime.Port)).rejects.toStrictEqual(new Error('"invalid-path" is not a valid derivation path'));
    });

    test('pri(derivation.validate) throws for invalid password', async () => {
      await expect(extension.handle('id', 'pri(derivation.validate)', {
        parentAddress: address,
        suri: '//path',
        parentPassword: 'invalid-password'
      }, {} as chrome.runtime.Port)).rejects.toStrictEqual(new Error('invalid password'));
    });

    test('pri(derivation.create) adds a derived account', async () => {
      await extension.handle('id', 'pri(derivation.create)', {
        parentAddress: address,
        name: 'child',
        suri: '//path',
        parentPassword: password,
        password
      }, {} as chrome.runtime.Port);
      expect(keyring.getAccounts()).toHaveLength(2);
    });

    test('pri(derivation.create) saves parent address in meta', async () => {
      await extension.handle('id', 'pri(derivation.create)', {
        parentAddress: address,
        name: 'child',
        suri: '//path',
        parentPassword: password,
        password
      }, {} as chrome.runtime.Port);
      expect(keyring.getAccount('5FP3TT3EruYBNh8YM8yoxsreMx7uZv1J1zNX7fFhoC5enwmN')?.meta.parentAddress).toEqual(address);
    });
  });
});
