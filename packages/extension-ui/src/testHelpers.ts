// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

export const flushAllPromises = (): Promise<void> => new Promise(resolve => setImmediate(resolve));
