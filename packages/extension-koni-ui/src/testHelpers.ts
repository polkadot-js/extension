// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

function setImmediate (fn: () => void): void {
  setTimeout(fn, 0);
}

export function flushAllPromises (): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}
