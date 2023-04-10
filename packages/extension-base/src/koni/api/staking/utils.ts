// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { _getChainNativeTokenBasicInfo } from '@subwallet/extension-base/services/chain-service/utils';
import { toUnit } from '@subwallet/extension-base/utils';

export function parseStakingBalance (balance: number, chain: string, network: Record<string, _ChainInfo>): number {
  const { decimals } = _getChainNativeTokenBasicInfo(network[chain]);

  return toUnit(balance, decimals);
}
