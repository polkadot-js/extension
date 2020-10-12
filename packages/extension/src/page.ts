// Copyright 2019-2020 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Message } from '@polkadot/extension-base/types';

import { enable, handleResponse, redirectPhishing } from '@polkadot/extension-base/page';
import isXmlorPdf from '@polkadot/extension-base/utils';
import { injectExtension } from '@polkadot/extension-inject';
import retrieveCheckDeny from '@polkadot/phishing';

// setup a response listener (events created by the loader for extension responses)
window.addEventListener('message', ({ data, source }: Message): void => {
  // only allow messages from our window, by the loader
  if (source !== window || data.origin !== 'content') {
    return;
  }

  if (data.id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleResponse(data as any);
  } else {
    console.error('Missing id for response.');
  }
});

const currentUrl = window.location.host;
const currentPathname = window.location.pathname;

retrieveCheckDeny(currentUrl)
  .then((isOnDeny) => {
    if (isOnDeny || isXmlorPdf(currentPathname)) {
      console.log('Phishing detected, redirecting to phishing info landing page');
      redirectPhishing().catch(console.error);
    } else {
      inject();
    }
  }).catch((e) => {
    console.error(e);
  });

function inject () {
  injectExtension(enable, {
    name: 'polkadot-js',
    version: process.env.PKG_VERSION as string
  });
}
