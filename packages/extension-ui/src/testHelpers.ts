// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

export function flushAllPromises (): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}
