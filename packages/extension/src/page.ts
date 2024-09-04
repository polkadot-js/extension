// Copyright 2019-2024 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Unstable } from '@substrate/connect-discovery';
import type { RequestSignatures, TransportRequestMessage } from '@polkadot/extension-base/background/types';
import type { Message } from '@polkadot/extension-base/types';

import { createTx } from '@substrate/light-client-extension-helpers/tx-helper';
import { getLightClientProvider } from '@substrate/light-client-extension-helpers/web-page';

import { MESSAGE_ORIGIN_CONTENT } from '@polkadot/extension-base/defaults';
import { enable, handleResponse, redirectIfPhishing } from '@polkadot/extension-base/page';
import { injectExtension } from '@polkadot/extension-inject';
import { connectInjectedExtension } from '@polkadot-api/pjs-signer';
import { toHex, fromHex } from '@polkadot-api/utils'
import { type SmoldotExtensionProviderDetail } from "@substrate/smoldot-discovery-connector"

import { CHANNEL_ID } from './constants.js';
import { packageInfo } from './packageInfo.js';

const PROVIDER_INFO = {
  icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'/>",
  name: 'Polkadot JS Extension',
  rdns: 'io.github.paritytech.PolkadotJsExtension',
  uuid: crypto.randomUUID()
};

const lightClientProvider = getLightClientProvider(CHANNEL_ID);

// #region Smoldot Discovery Provider
{
  const provider = lightClientProvider.then(async (provider) => {
    const { make: makeSmoldotDiscoveryConnector } = await import('@substrate/smoldot-discovery-connector')
    return makeSmoldotDiscoveryConnector(provider)
  })
  const detail: SmoldotExtensionProviderDetail = Object.freeze({
    info: PROVIDER_INFO,
    kind: 'smoldot-v1',
    provider
  });

  window.addEventListener(
    'substrateDiscovery:requestProvider',
    ({ detail: { onProvider } }) => onProvider(detail)
  );

  window.dispatchEvent(
    new CustomEvent('substrateDiscovery:announceProvider', {
      detail
    })
  );
}
// #endregion

// #region Connect Discovery Provider
{
  const provider = lightClientProvider.then((lightClientProvider): Unstable.Provider => ({
    ...lightClientProvider,
    async createTx(chainId: string, from: string, callData: string) {
      const chains = Object.values(lightClientProvider.getChains());
      const chain = chains.find(({ genesisHash }) => genesisHash === chainId);

      if (!chain) {
        throw new Error('unknown chain');
      }

      const injectedExt = await connectInjectedExtension('polkadot-js');

      const account = injectedExt.getAccounts()
        .find((account) => toHex(account.polkadotSigner.publicKey) === from);

      if (!account) {
        throw new Error('no account');
      }

      const signer = account.polkadotSigner;

      const tx = await createTx(chain.connect)({ callData: fromHex(callData), signer });

      return toHex(tx);
    },
    async getAccounts(_chainId: string) {
      const injectedExt = await connectInjectedExtension('polkadot-js');
      const accounts = injectedExt.getAccounts();

      return accounts;
    }
  }));

  const detail: Unstable.SubstrateConnectProviderDetail = Object.freeze({
    info: PROVIDER_INFO,
    kind: 'substrate-connect-unstable',
    provider
  });

  window.addEventListener(
    'substrateDiscovery:requestProvider',
    ({ detail: { onProvider } }) => onProvider(detail)
  );

  window.dispatchEvent(
    new CustomEvent('substrateDiscovery:announceProvider', {
      detail
    })
  );
}
// #endregion

function inject() {
  injectExtension(enable, {
    name: 'polkadot-js',
    version: packageInfo.version
  });
}

// setup a response listener (events created by the loader for extension responses)
window.addEventListener('message', ({ data, source }: Message): void => {
  // only allow messages from our window, by the loader
  if (source !== window || data.origin !== MESSAGE_ORIGIN_CONTENT) {
    return;
  }

  if (data.id) {
    handleResponse(data as TransportRequestMessage<keyof RequestSignatures>);
  } else {
    console.error('Missing id for response.');
  }
});

redirectIfPhishing().then((gotRedirected) => {
  if (!gotRedirected) {
    inject();
  }
}).catch((e) => {
  console.warn(`Unable to determine if the site is in the phishing list: ${(e as Error).message}`);
  inject();
});
