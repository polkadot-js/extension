// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AccountJson } from '@polkadot/extension-base/background/types';

export function nextDerivationPath (accounts: AccountJson[], parentAddress: string): string {
  const siblingsCount = accounts.filter((account) => account.parentAddress === parentAddress).length;

  return `//${siblingsCount}`;
}
