import Extension from '@polkadot/extension/background/handlers/Extension';
import keyring from '@polkadot/ui-keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import State from '@polkadot/extension/background/handlers/State';
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
    const result = await extension.handle('id', 'pri(accounts.export)', {
      address,
      password: 'passw0rd'
    }, {} as chrome.runtime.Port) as ResponseAccountExport;

    expect(result.exportedJson).toContain(address);
    expect(result.exportedJson).toContain('"encoded"');
  });
});
