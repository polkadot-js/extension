// Copyright 2019-2022 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Message } from '@subwallet/extension-base/types';

import { TransportRequestMessage } from '@subwallet/extension-base/background/types';
import { MESSAGE_ORIGIN_CONTENT, MESSAGE_ORIGIN_PAGE, PORT_CONTENT } from '@subwallet/extension-base/defaults';
import { getId } from '@subwallet/extension-base/utils/getId';
import { chrome } from '@subwallet/extension-inject/chrome';

// connect to the extension
const port = chrome.runtime.connect({ name: PORT_CONTENT });

// redirect users if this page is considered as phishing, otherwise return false
const handleRedirectPhishing: { id: string, resolve?: (value: (boolean | PromiseLike<boolean>)) => void, reject?: (e: Error) => void } = {
  id: 'redirect-phishing-' + getId()
};

const redirectIfPhishingProm = new Promise<boolean>((resolve, reject) => {
  handleRedirectPhishing.resolve = resolve;
  handleRedirectPhishing.reject = reject;

  const transportRequestMessage: TransportRequestMessage<'pub(phishing.redirectIfDenied)'> = {
    id: handleRedirectPhishing.id,
    message: 'pub(phishing.redirectIfDenied)',
    origin: MESSAGE_ORIGIN_PAGE,
    request: null
  };

  port.postMessage(transportRequestMessage);
});

// send any messages from the extension back to the page
port.onMessage.addListener((data: {id: string, response: any}): void => {
  const { id, resolve } = handleRedirectPhishing;

  if (data?.id === id) {
    resolve && resolve(Boolean(data.response));
  } else {
    window.postMessage({ ...data, origin: MESSAGE_ORIGIN_CONTENT }, '*');
  }
});

// all messages from the page, pass them to the extension
window.addEventListener('message', ({ data, source }: Message): void => {
  // only allow messages from our window, by the inject
  if (source !== window || data.origin !== MESSAGE_ORIGIN_PAGE) {
    return;
  }

  port.postMessage(data);
});

// inject our data injector
const container = document.head || document.documentElement;
const placeholderScript = document.createElement('script');
const script = document.createElement('script');
const version = process.env.PKG_VERSION as string;
const walletKey = 'subwallet-js';

script.src = chrome.extension.getURL('page.js');

placeholderScript.textContent = `class SubWalletPlaceholder {
  provider = undefined;
  isSubWallet = true;
  connected = false;
  isConnected = () => false;
  __waitProvider = (async () => {
    const self = this;
    if (self.provider) {
      return self.provider;
    } else {
      return await new Promise((resolve, reject) => {
        let retry = 0;
        const interval = setInterval(() => {
          if (++retry > 30) {
            clearInterval(interval);
            reject(new Error("SubWallet provider not found"));
          }
          if (self.provider) {
            clearInterval(interval);
            resolve(self.provider);
          }
        }, 100);
      });
    }
  })();
  on() {
    this.__waitProvider.then((provider) => {
      provider.on(...arguments);
    });
  }
  once() {
    this.__waitProvider.then((provider) => {
      provider.once(...arguments);
    });
  }
  off() {
    this.__waitProvider.then((provider) => {
      provider.off(...arguments);
    });
  }
  addListener() {
    this.__waitProvider.then((provider) => {
      provider.addListener(...arguments);
    });
  }
  removeListener() {
    this.__waitProvider.then((provider) => {
      provider.removeListener(...arguments);
    });
  }
  removeAllListeners() {
    this.__waitProvider.then((provider) => {
      provider.removeAllListeners(...arguments);
    });
  }
  async enable() {
    const provider = await this.__waitProvider;
    return await provider.enable(...arguments);
  }
  async request() {
    const provider = await this.__waitProvider;
    return await provider.request(...arguments);
  }
  async send() {
    const provider = await this.__waitProvider;
    return await provider.send(...arguments);
  }
  async sendAsync() {
    const provider = await this.__waitProvider;
    return await provider.sendAsync(...arguments);
  }
}

class SubWalletPolkadotPlaceholder {
  isPlaceholder;

  async enable(origin) {
    const provider = await this.__waitProvider;
    return await provider.enable(...arguments);
  }
}

window.injectedWeb3 = window.injectedWeb3 || {};

if (!window.injectedWeb3['${walletKey}']) {
  window.injectedWeb3['${walletKey}'] = {
    isPlaceholder: true,
    version: '${version}',
    enable: async (origin) => {
      const wallet = await new Promise((resolve, reject) => {
        let retry = 0;
        const interval = setInterval(() => {
          if (++retry > 30) {
            clearInterval(interval);
            reject(new Error("SubWallet provider not found"));
          }
          if (!window.injectedWeb3['${walletKey}'].isPlaceholder) {
            clearInterval(interval);
            resolve();
          }
        }, 100);
      });

      return await window.injectedWeb3['${walletKey}'].enable(origin);
    }
  };
}

window.SubWallet = new Proxy(new SubWalletPlaceholder(), {
  get(obj, prop) {
    if (prop === "provider") {
      return undefined;
    }

    if (obj.provider) {
      return Reflect.get(obj.provider, prop);
    } else {
      return Reflect.get(obj, prop);
    }
  }
});
`;

container.insertBefore(script, container.children[0]);
container.insertBefore(placeholderScript, container.children[0]);
container.removeChild(script);
container.removeChild(placeholderScript);

redirectIfPhishingProm.then((gotRedirected) => {
  if (!gotRedirected) {
    console.log('Check phishing by URL: Passed.');
  }
}).catch((e) => {
  console.warn(`Unable to determine if the site is in the phishing list: ${(e as Error).message}`);
});
