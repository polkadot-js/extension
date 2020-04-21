// Copyright 2019-2020 @polkadot/extension-dapp authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

export function documentReadyPromise <T> (inner: Promise<T>): Promise<T> {
  return new Promise((resolve): void => {
    if (['interactive', 'loaded'].includes(document.readyState)) {
      resolve(inner);
    } else {
      window.addEventListener('load', (): void => {
        resolve(inner);
      });
    }
  });
}
