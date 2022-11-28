// Copyright 2019-2022 @polkadot/extension-inject authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Injected, InjectedExtension, InjectedWindow, InjectOptions } from './types';

export { packageInfo } from './packageInfo';

// cyrb53 (c) 2018 bryc (github.com/bryc)
// A fast and simple hash function with decent collision resistance.
// Largely inspired by MurmurHash2/3, but with a focus on speed/simplicity.
// Public domain. Attribution appreciated.
//
// From https://github.com/bryc/code/blob/fed42df9db547493452e32375c93d7854383e480/jshash/experimental/cyrb53.js
// As shared in https://stackoverflow.com/a/52171480
//
// Small changes made to the code as linked above:
// . - Seed value is required (expected as Date.now() in usage, could change)
//   - Return value is a hex string (as per comment in SO answer)
//   - TS typings added
//   - Non-intrusive coding-style variable declaration changes
function cyrb53 (input: string, seed: number): string {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;

  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);

    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }

  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  // https://stackoverflow.com/a/52171480
  return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
}

// It is recommended to always use the function below to shield the extension and dapp from
// any future changes. The exposed interface will manage access between the 2 environments,
// be it via window (current), postMessage (under consideration) or any other mechanism
export function injectExtension (enable: (origin: string) => Promise<Injected>, { name, version }: InjectOptions): void {
  // small helper with the typescript types, just cast window
  const windowInject = window as Window & InjectedWindow;

  // don't clobber the existing object, we will add it (or create as needed)
  windowInject.injectedWeb3 = windowInject.injectedWeb3 || {};

  // expose our extension on the window object
  windowInject.injectedWeb3[cyrb53(`${name}/${version}`, Date.now())] = {
    connect: (origin: string): Promise<InjectedExtension> =>
      enable(origin).then(({ accounts, metadata, provider, signer }) => ({
        accounts, metadata, name, provider, signer, version
      }))
  };

  // // add our enable function
  // windowInject.injectedWeb3[name] = {
  //   enable: (origin: string): Promise<Injected> =>
  //     enable(origin),
  //   version
  // };
}
