// Copyright 2019-2020 @polkadot/extension-dapp authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

export function documentReadyPromise <T> (creator: () => Promise<T>): Promise<T> {
  return new Promise((resolve): void => {
    if (['interactive', 'complete'].includes(document.readyState)) {
      resolve(creator());
    } else {
      window.addEventListener('load', (): void => {
        resolve(creator());
      });
    }
  });
}
