// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { BalanceAccountType, PalletAssetsAssetAccount, PalletAssetsAssetAccountWithoutStatus, PalletAssetsAssetAccountWithStatus } from '@subwallet/extension-base/core/substrate/types';
import { _getAppliedExistentialDeposit, getStrictMode } from '@subwallet/extension-base/core/utils';

function isWithStatus (accountInfo: PalletAssetsAssetAccount): accountInfo is PalletAssetsAssetAccountWithStatus {
  return (accountInfo as PalletAssetsAssetAccountWithStatus).status !== undefined && (accountInfo as PalletAssetsAssetAccountWithoutStatus).isFrozen === undefined;
}

export function _getAssetsPalletTransferable (accountInfo: PalletAssetsAssetAccount, existentialDeposit: string, extrinsicType?: ExtrinsicType): bigint {
  const strictMode = getStrictMode(BalanceAccountType.PalletAssetsAssetAccount, extrinsicType);

  if (isWithStatus(accountInfo)) {
    return _getAssetsPalletTransferableWithStatus(accountInfo, existentialDeposit, strictMode);
  } else {
    return _getAssetsPalletTransferableWithoutStatus(accountInfo, existentialDeposit, strictMode);
  }
}

export function _getAssetsPalletLocked (accountInfo: PalletAssetsAssetAccount): bigint {
  if (isWithStatus(accountInfo)) {
    return _getAssetsPalletLockedWithStatus(accountInfo);
  } else {
    return _getAssetsPalletLockedWithoutStatus(accountInfo);
  }
}

// ----------------------------------------------------------------------

export function _getAssetsPalletTransferableWithStatus (accountInfo: PalletAssetsAssetAccountWithStatus, existentialDeposit: string, strictMode?: boolean) {
  const bnAppliedExistentialDeposit = _getAppliedExistentialDeposit(existentialDeposit, strictMode);

  return accountInfo.status === 'Liquid' ? BigInt(accountInfo.balance) - bnAppliedExistentialDeposit : BigInt(0);
}

export function _getAssetsPalletTransferableWithoutStatus (accountInfo: PalletAssetsAssetAccountWithoutStatus, existentialDeposit: string, strictMode?: boolean) {
  const bnAppliedExistentialDeposit = _getAppliedExistentialDeposit(existentialDeposit, strictMode);

  return !accountInfo.isFrozen ? BigInt(accountInfo.balance) - bnAppliedExistentialDeposit : BigInt(0);
}

export function _getAssetsPalletLockedWithStatus (accountInfo: PalletAssetsAssetAccountWithStatus) {
  return accountInfo.status !== 'Liquid' ? BigInt(accountInfo.balance) : BigInt(0);
}

export function _getAssetsPalletLockedWithoutStatus (accountInfo: PalletAssetsAssetAccountWithoutStatus) {
  return accountInfo.isFrozen ? BigInt(accountInfo.balance) : BigInt(0);
}
