// Copyright 2019-2022 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { RequestSignatures, TransportRequestMessage } from '@subwallet/extension-base/background/types';
import type { Message } from '@subwallet/extension-base/types';

import { MESSAGE_ORIGIN_CONTENT } from '@subwallet/extension-base/defaults';
import { enable, handleResponse } from '@subwallet/extension-base/page';
import { injectEvmExtension, injectExtension } from '@subwallet/extension-inject';
import { initEvmProvider } from '@subwallet/extension-koni-base/page';

const version = process.env.PKG_VERSION as string;

function inject () {
  injectExtension(enable, {
    name: 'subwallet-js',
    version: version
  });
  injectEvmExtension(initEvmProvider(version));
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

inject();
