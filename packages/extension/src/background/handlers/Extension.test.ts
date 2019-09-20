import Extension from '@polkadot/extension/background/handlers/Extension';
import keyring from '@polkadot/ui-keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import State from '@polkadot/extension/background/handlers/State';
import { Port } from 'chrome';
import { ResponseAccountExport } from '@polkadot/extension/background/types';
import ExtensionStore from '@polkadot/ui-keyring/stores/Extension';

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
    keyring.getPair(address);
    const result = await extension.handle('id', 'pri(accounts.export)', {
      address,
      password: 'passw0rd'
    }, {} as Port) as ResponseAccountExport;

    expect(result.json.address).toEqual(address);
    expect(result.json.encoded).toHaveLength(316);
  });
});
