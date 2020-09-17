// Copyright 2019-2020 @polkadot/extension-dapp authors & contributors
// SPDX-License-Identifier: Apache-2.0

export function documentReadyPromise <T> (creator: () => Promise<T>): Promise<T> {
  return new Promise((resolve): void => {
    if (['complete', 'interactive'].includes(document.readyState)) {
      resolve(creator());
    } else {
      window.addEventListener('load', (): void => {
        resolve(creator());
      });
    }
  });
}
