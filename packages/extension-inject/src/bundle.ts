// Copyright 2019-2022 @polkadot/extension-inject authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AuthRequestOption, Injected, InjectedWindow, InjectOptions } from './types';

import { EIP6963ProviderDetail, EIP6963ProviderInfo, EvmProvider } from './types';

export { packageInfo } from './packageInfo';

// It is recommended to always use the function below to shield the extension and dapp from
// any future changes. The exposed interface will manage access between the 2 environments,
// be it via window (current), postMessage (under consideration) or any other mechanism
export function injectExtension (enable: (origin: string, opt?: AuthRequestOption) => Promise<Injected>, { name, version }: InjectOptions): void {
  // small helper with the typescript types, just cast window
  const windowInject = window as Window & InjectedWindow;

  // don't clobber the existing object, we will add it (or create as needed)
  windowInject.injectedWeb3 = windowInject.injectedWeb3 || {};

  // add our enable function
  windowInject.injectedWeb3[name] = {
    enable: (origin: string, opt?: AuthRequestOption): Promise<Injected> =>
      enable(origin, opt),
    version
  };
}

// Inject EVM Provider
export function injectEvmExtension (evmProvider: EvmProvider): void {
  // small helper with the typescript types, just cast window
  const windowInject = window as Window & InjectedWindow;

  // add our enable function
  if (windowInject.SubWallet) {
    // Provider has been initialized in proxy mode
    windowInject.SubWallet.provider = evmProvider;
  } else {
    // Provider has been initialized in direct mode
    windowInject.SubWallet = evmProvider;
  }

  if (!windowInject.ethereum) {
    windowInject.ethereum = evmProvider;
    windowInject.dispatchEvent(new Event('ethereum#initialized'));
  }

  windowInject.dispatchEvent(new Event('subwallet#initialized'));

  // // Publish to global if window.ethereum is not available
  // windowInject.addEventListener('load', () => {
  //   if (!windowInject.ethereum) {
  //     windowInject.ethereum = evmProvider;
  //     windowInject.dispatchEvent(new Event('ethereum#initialized'));
  //   }
  // });

  inject6963EIP(evmProvider);
}

export const eip6963ProviderInfo: EIP6963ProviderInfo = {
  uuid: '10c67337-9211-48d9-aab0-cecdc4224acc',
  name: 'SubWallet',
  icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNODAgNGM1Ny42MyAwIDc2IDE4LjM3IDc2IDc2IDAgNTcuNjMtMTguMzcgNzYtNzYgNzYtNTcuNjMgMC03Ni0xOC4zNy03Ni03NkM0IDIyLjM3IDIyLjM3IDQgODAgNFoiIGZpbGw9InVybCgjYSkiLz48ZyBjbGlwLXBhdGg9InVybCgjYikiPjxwYXRoIGQ9Ik0xMTIuNjE1IDY2LjcyVjUzLjM5OEw1OC43NiAzMiA0OCAzNy40MTJsLjA1NyA0MS40NjQgNDAuMjkyIDE2LjA3LTIxLjUyIDkuMDc1di03LjAxOEw1Ni45NSA5My4wM2wtOC44OTMgNC4xNjN2MjUuMzk1TDU4Ljc2OSAxMjhsNTMuODQ2LTI0LjA2MlY4Ni44NjlMNjQuMTU0IDY3LjY1N1Y1NmwzOC40NDkgMTUuMjE2IDEwLjAxMi00LjQ5NloiIGZpbGw9IiNmZmYiLz48L2c+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJhIiB4MT0iODAiIHkxPSI0IiB4Mj0iODAiIHkyPSIxNTYiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj48c3RvcCBzdG9wLWNvbG9yPSIjMDA0QkZGIi8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjNENFQUFDIi8+PC9saW5lYXJHcmFkaWVudD48Y2xpcFBhdGggaWQ9ImIiPjxwYXRoIGZpbGw9IiNmZmYiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDQ4IDMyKSIgZD0iTTAgMGg2NC42MTV2OTZIMHoiLz48L2NsaXBQYXRoPjwvZGVmcz48L3N2Zz4=',
  rdns: 'app.subwallet'
};

export const inject6963EIP = (provider: EvmProvider) => {
  const _provider = new Proxy(provider, {
    get (target, key) {
      if (key === 'then') {
        return Promise.resolve(target);
      }

      const proxyTarget = Reflect.get(target, key) as Record<string, any>;

      if (typeof proxyTarget?.bind === 'function') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return
        return proxyTarget.bind(target);
      }

      return proxyTarget;
    },
    deleteProperty () {
      return true;
    }
  });

  const announceProvider = () => {
    const detail: EIP6963ProviderDetail = Object.freeze({ info: eip6963ProviderInfo, provider: _provider });
    const event = new CustomEvent('eip6963:announceProvider', { detail });

    window.dispatchEvent(event);
  };

  window.addEventListener('eip6963:requestProvider', announceProvider);

  announceProvider();
};
