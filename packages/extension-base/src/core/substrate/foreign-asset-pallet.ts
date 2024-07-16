// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import BigN from 'bignumber.js';

export type PalletAssetsAssetAccount = {
  balance: number | string,
  status: 'Frozen' | 'Liquid' | 'Blocked',
  reason: Record<string, unknown>,
  extra: unknown
}

export function _getForeignAssetPalletTransferable (accountInfo: PalletAssetsAssetAccount | undefined): string {
  return !accountInfo || accountInfo.status !== 'Liquid' ? '0' : new BigN(accountInfo.balance).toFixed();
}

export function _getForeignAssetPalletLockedBalance (accountInfo: PalletAssetsAssetAccount | undefined): string {
  return !accountInfo || accountInfo.status === 'Liquid' ? '0' : new BigN(accountInfo.balance).toFixed();
}
