// Copyright 2019-2021 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

export function withErrorLog (fn: () => Promise<unknown>): void {
  try {
    const p = fn();

    if (typeof p !== 'undefined' && typeof p.catch !== 'undefined') {
      p.catch(console.error);
    }
  } catch (e) {
    console.error(e);
  }
}
