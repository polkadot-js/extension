// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

export type PalletAssetsAssetAccount = {
  balance: number | string,
  status: 'Frozen' | 'Liquid' | 'Blocked',
  reason: Record<string, unknown>,
  extra: unknown
}

export function _getForeignAssetPalletTransferable (accountInfo: PalletAssetsAssetAccount): bigint {
  return accountInfo.status !== 'Liquid' ? BigInt(0) : BigInt(accountInfo.balance);
}

export function _getForeignAssetPalletLockedBalance (accountInfo: PalletAssetsAssetAccount): bigint {
  return accountInfo.status === 'Liquid' ? BigInt(0) : BigInt(accountInfo.balance);
}
