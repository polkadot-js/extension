// Copyright 2019-2021 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

export function withErrorLog (p: Promise<unknown>): void {
  if (typeof p !== 'undefined' && typeof p.catch !== 'undefined') {
    p.catch(console.error);
  }
}
