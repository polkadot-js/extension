// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AccountJson } from '@subwallet/extension-base/background/types';

export function nextDerivationPath (accounts: AccountJson[], parentAddress: string): string {
  const account = accounts.find((acc) => acc.address === parentAddress);
  const siblingsCount = accounts.filter((account) => account.parentAddress === parentAddress).length + (account?.type === 'ethereum' ? 1 : 0);

  return `//${siblingsCount}`;
}
