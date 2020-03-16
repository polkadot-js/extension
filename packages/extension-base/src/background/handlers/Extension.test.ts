// Copyright 2019-2020 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { ResponseAccountExport } from '../types';

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

  test('exports account from keyring', async () => {
    const extension = await createExtension();
    const { pair: { address } } = keyring.addUri(
      'seed sock milk update focus rotate barely fade car face mechanic mercy', 'passw0rd'
    );
    const result = await extension.handle('id', 'pri(accounts.export)', {
      address,
      password: 'passw0rd'
    }, {} as chrome.runtime.Port) as ResponseAccountExport;

    expect(result.exportedJson).toContain(address);
    expect(result.exportedJson).toContain('"encoded"');
  });
});
