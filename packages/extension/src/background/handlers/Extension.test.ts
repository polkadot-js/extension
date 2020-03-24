// Copyright 2019-2020 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { ResponseAccountExport } from '@polkadot/extension/background/types';

import Extension from '@polkadot/extension/background/handlers/Extension';
import State from '@polkadot/extension/background/handlers/State';
import keyring from '@polkadot/ui-keyring';
import ExtensionStore from '@polkadot/ui-keyring/stores/Extension';
import { cryptoWaitReady } from '@polkadot/util-crypto';

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
    }, {} as chrome.runtime.Port) as ResponseAccountExport;

    expect(result.exportedJson).toContain(address);
    expect(result.exportedJson).toContain('"encoded"');
  });

  describe('account derivation', () => {
    const createAccount = async () => {
      await extension.handle('id', 'pri(accounts.create.suri)', {
        name: 'parent',
        password,
        suri
      }, {} as chrome.runtime.Port);
      const {address} = await extension.handle('id', 'pri(seed.validate)', {
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
        suri: '//path'
      }, {} as chrome.runtime.Port);
      expect(result).toStrictEqual({address: '5FPRjD2NUA9S99ev2dhJjqa58SAHxrKVKZyfrceSiGEfAxXB'});
    });

    test('pri(derivation.validate) throws for invalid suri', async () => {
      await expect(extension.handle('id', 'pri(derivation.validate)', {
        parentAddress: address,
        suri: 'invalid-path'
      }, {} as chrome.runtime.Port)).rejects.toStrictEqual(new Error('"invalid-path" is not a valid derivation path'));
    });

    test('pri(derivation.create) adds a derived account', async () => {
      await extension.handle('id', 'pri(derivation.create)', {
        parentAddress: address,
        name: 'child',
        suri: '//path',
        password
      }, {} as chrome.runtime.Port);
      expect(keyring.getAccounts()).toHaveLength(2);
    });
  });
});
