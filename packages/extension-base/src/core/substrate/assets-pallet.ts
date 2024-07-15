// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import BigN from "bignumber.js";

export type PalletAssetsAssetAccount = {
  balance: number | string,
  status: 'Frozen' | 'Liquid' | 'Blocked',
  reason: Record<string, unknown>,
  extra: unknown
}

export function _getAssetsPalletTransferable (accountInfo: PalletAssetsAssetAccount | undefined): string {
  let bnTransferable = new BigN(0);

  if (!accountInfo) {
    return '0';
  }

  if (['Liquid'].includes(accountInfo.status as string)) {
    bnTransferable = new BigN(accountInfo.balance);
  }

  return BigN.max(bnTransferable, 0).toFixed();
}

export function _getAssetsPalletLockedBalance (accountInfo: PalletAssetsAssetAccount | undefined): string {
  let bnFrozen = new BigN(0);

  if (!accountInfo) {
    return '0';
  }

  if (['Blocked', 'Frozen'].includes(accountInfo.status as string)) { // todo: check case accountInfo has isFrozen?
    bnFrozen = new BigN(accountInfo.balance);
  }

  return BigN.max(bnFrozen, 0).toFixed();
}
