// Copyright 2019 @polkadot/extension-dapp authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { Injected, InjectedWindow, InjectOptions } from './types';

// It is recomemender to always use the function below to shield the extension and dapp from
// any future changes. The exposed interface will manage access between the 2 environments,
// be it via window (current), postMessage (under consideration) or any other mechanism
export function injectExtension (enable: (origin: string) => Promise<Injected>, { name, version }: InjectOptions): void {
  // small helper with the typescript types, just cast window
  const windowInject = window as InjectedWindow;

  // don't clobber the existing object, we will add it it (or create as needed)
  windowInject.injectedWeb3 = windowInject.injectedWeb3 || {};

  // add our enable function
  windowInject.injectedWeb3[name] = {
    enable: (origin: string): Promise<Injected> =>
      enable(origin),
    version
  };
}
