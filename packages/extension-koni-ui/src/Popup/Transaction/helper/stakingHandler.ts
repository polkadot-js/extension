// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

export function getUnstakingPeriod (unstakingPeriod?: number) {
  if (unstakingPeriod) {
    const days = unstakingPeriod / 24;

    if (days < 1) {
      return 'Soon';
    } else {
      return `${days}`;
    }
  }

  return '';
}
