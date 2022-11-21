// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NetworkJson } from '@subwallet/extension-base/background/KoniTypes';
import { toUnit } from '@subwallet/extension-koni-base/utils';

export function parseStakingBalance (balance: number, chain: string, network: Record<string, NetworkJson>): number {
  return toUnit(balance, network[chain].decimals as number);
}
