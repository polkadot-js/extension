// Copyright 2019-2020 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import '../../../../../__mocks__/chrome';

import keyring from '@polkadot/ui-keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';

import { AccountsStore } from '../../stores';
import Extension from './Extension';
import State from './State';

describe('Extension', () => {
  let extension: Extension;
  const suri = 'seed sock milk update focus rotate barely fade car face mechanic mercy';
  const password = 'passw0rd';

  async function createExtension (): Promise<Extension> {
    await cryptoWaitReady();

    keyring.loadAll({ store: new AccountsStore() });

    return new Extension(new State());
  }

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

  beforeAll(async () => {
    extension = await createExtension();
  });

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
    let address: string;

    beforeEach(async () => {
      address = await createAccount();
    });

    test('pri(derivation.validate) passes for valid suri', async () => {
      const result = await extension.handle('id', 'pri(derivation.validate)', {
        parentAddress: address,
        parentPassword: password,
        suri: '//path'
      }, {} as chrome.runtime.Port);

      expect(result).toStrictEqual({
        address: '5FP3TT3EruYBNh8YM8yoxsreMx7uZv1J1zNX7fFhoC5enwmN',
        suri: '//path'
      });
    });

    test('pri(derivation.validate) throws for invalid suri', async () => {
      await expect(extension.handle('id', 'pri(derivation.validate)', {
        parentAddress: address,
        parentPassword: password,
        suri: 'invalid-path'
      }, {} as chrome.runtime.Port)).rejects.toStrictEqual(new Error('"invalid-path" is not a valid derivation path'));
    });

    test('pri(derivation.validate) throws for invalid password', async () => {
      await expect(extension.handle('id', 'pri(derivation.validate)', {
        parentAddress: address,
        parentPassword: 'invalid-password',
        suri: '//path'
      }, {} as chrome.runtime.Port)).rejects.toStrictEqual(new Error('invalid password'));
    });

    test('pri(derivation.create) adds a derived account', async () => {
      await extension.handle('id', 'pri(derivation.create)', {
        name: 'child',
        parentAddress: address,
        parentPassword: password,
        password,
        suri: '//path'
      }, {} as chrome.runtime.Port);
      expect(keyring.getAccounts()).toHaveLength(2);
    });

    test('pri(derivation.create) saves parent address in meta', async () => {
      await extension.handle('id', 'pri(derivation.create)', {
        name: 'child',
        parentAddress: address,
        parentPassword: password,
        password,
        suri: '//path'
      }, {} as chrome.runtime.Port);
      expect(keyring.getAccount('5FP3TT3EruYBNh8YM8yoxsreMx7uZv1J1zNX7fFhoC5enwmN')?.meta.parentAddress).toEqual(address);
    });
  });

  describe('account management', () => {
    let address: string;

    beforeEach(async () => {
      address = await createAccount();
    });

    test('pri(accounts.changePassword) changes account password', async () => {
      const newPass = 'pa55word';
      const wrongPass = 'ZZzzZZzz';

      await expect(extension.handle('id', 'pri(accounts.changePassword)', {
        address,
        newPass,
        oldPass: wrongPass
      }, {} as chrome.runtime.Port)).rejects.toStrictEqual(new Error('oldPass is invalid'));

      await expect(extension.handle('id', 'pri(accounts.changePassword)', {
        address,
        newPass,
        oldPass: password
      }, {} as chrome.runtime.Port)).resolves.toEqual(true);

      const pair = keyring.getPair(address);

      expect(pair.decodePkcs8(newPass)).toEqual(undefined);

      expect(() => {
        pair.decodePkcs8(password);
      }).toThrowError('Unable to decode using the supplied passphrase');
    });
  });
});
