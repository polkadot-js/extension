// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { AccountJson } from '@polkadot/extension-base/background/types';

export function nextDerivationPath (accounts: AccountJson[], parentAddress: string): string {
  const siblingsCount = accounts.filter((account) => account.parentAddress === parentAddress).length;

  return `//${siblingsCount}`;
}
