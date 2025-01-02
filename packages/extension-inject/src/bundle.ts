// Copyright 2019-2025 @polkadot/extension-inject authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Injected, InjectedExtension, InjectedWindow, InjectOptions } from './types.js';

import { cyrb53 } from './cyrb53.js';

export { packageInfo } from './packageInfo.js';

// setting for new-style connect (more-secure with no details exposed without
// user acknowledgement, however slightly less-compatible with all dapps, some
// may have not upgraded and don't have access to the latest interfaces)
//
// NOTE: In future versions this will be made the default
const IS_CONNECT_CAPABLE = false;

// It is recommended to always use the function below to shield the extension and dapp from
// any future changes. The exposed interface will manage access between the 2 environments,
// be it via window (current), postMessage (under consideration) or any other mechanism
export function injectExtension (enable: (origin: string) => Promise<Injected>, { name, version }: InjectOptions): void {
  // small helper with the typescript types, just cast window
  const windowInject = window as Window & InjectedWindow;

  // don't clobber the existing object, we will add it (or create as needed)
  windowInject.injectedWeb3 = windowInject.injectedWeb3 || {};

  if (IS_CONNECT_CAPABLE) {
    // expose our extension on the window object, new-style with connect(origin)
    windowInject.injectedWeb3[cyrb53(`${name}/${version}`)] = {
      connect: (origin: string): Promise<InjectedExtension> =>
        enable(origin).then(({ accounts, metadata, provider, signer }) => ({
          accounts, metadata, name, provider, signer, version
        })),
      enable: (): Promise<Injected> =>
        Promise.reject(
          new Error('This extension does not have support for enable(...), rather is only supports the new connect(...) variant (no extension name/version metadata without specific user-approval)')
        )
    };
  } else {
    // expose our extension on the window object, old-style with enable(origin)
    windowInject.injectedWeb3[name] = {
      enable: (origin: string): Promise<Injected> =>
        enable(origin),
      version
    };
  }
}
