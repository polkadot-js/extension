// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { APIItemState } from '@subwallet/extension-base/background/KoniTypes';
import { BalanceItem } from '@subwallet/extension-base/types';
import { sumBN } from '@subwallet/extension-base/utils';
import BN from 'bn.js';

/**
 * Group the balance of {token} from {items} into {address}
 * @param {BalanceItem[]} items - List balance want to group
 * @param {string} address - Address will be grouped to
 * @param {string} token - Slug of token will be group balance
 * @return {BalanceItem} - Grouped balance information of token
 */
export const groupBalance = (items: BalanceItem[], address: string, token: string): BalanceItem => {
  const result: BalanceItem = {
    address,
    tokenSlug: token,
    free: sumBN(items.map((item) => new BN(item.free))).toString(),
    locked: sumBN(items.map((item) => new BN(item.locked))).toString(),
    state: APIItemState.READY
  };

  for (const item of items) {
    if (item.substrateInfo) {
      if (!result.substrateInfo) {
        result.substrateInfo = { ...item.substrateInfo };
      } else {
        const old = { ...result.substrateInfo };
        const _new = { ...item.substrateInfo };

        result.substrateInfo = {
          reserved: new BN(old.reserved || '0').add(new BN(_new.reserved || '0')).toString(),
          feeFrozen: new BN(old.feeFrozen || '0').add(new BN(_new.feeFrozen || '0')).toString(),
          miscFrozen: new BN(old.miscFrozen || '0').add(new BN(_new.miscFrozen || '0')).toString()
        };
      }
    }
  }

  return result;
};
