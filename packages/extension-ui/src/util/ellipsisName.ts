// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

export const ellipsisName = (input: string | null | undefined): string | null => {
  if (!input || input.length < 8) {
    return null;
  }

  const firstHalf = input.slice(0, 6);
  const secondHalf = input.slice(-6);

  return firstHalf + '...' + secondHalf;
};
