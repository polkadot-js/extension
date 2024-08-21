// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { BalanceAccountType, PalletAssetsAssetAccount, PalletAssetsAssetAccountWithoutStatus, PalletAssetsAssetAccountWithStatus } from '@subwallet/extension-base/core/substrate/types';
import { _getAppliedExistentialDeposit, getStrictMode } from '@subwallet/extension-base/core/utils';

function isWithStatus (accountInfo: PalletAssetsAssetAccount | undefined): accountInfo is PalletAssetsAssetAccountWithStatus {
  return (accountInfo as PalletAssetsAssetAccountWithStatus).status !== undefined && (accountInfo as PalletAssetsAssetAccountWithoutStatus).isFrozen === undefined;
}

export function _getAssetsPalletTransferable (accountInfo: PalletAssetsAssetAccount | undefined, existentialDeposit: string, extrinsicType?: ExtrinsicType): bigint {
  const strictMode = getStrictMode(BalanceAccountType.PalletAssetsAssetAccount, extrinsicType);

  if (isWithStatus(accountInfo)) {
    return _getAssetsPalletTransferableWithStatus(accountInfo, existentialDeposit, strictMode);
  } else {
    return _getAssetsPalletTransferableWithoutStatus(accountInfo, existentialDeposit, strictMode);
  }
}

export function _getAssetsPalletLocked (accountInfo: PalletAssetsAssetAccount | undefined): bigint {
  if (isWithStatus(accountInfo)) {
    return _getAssetsPalletLockedWithStatus(accountInfo);
  } else {
    return _getAssetsPalletLockedWithoutStatus(accountInfo);
  }
}

// ----------------------------------------------------------------------

export function _getAssetsPalletTransferableWithStatus (accountInfo: PalletAssetsAssetAccountWithStatus | undefined, existentialDeposit: string, strictMode?: boolean) {
  const bnAppliedExistentialDeposit = _getAppliedExistentialDeposit(existentialDeposit, strictMode);

  let bnTransferable = BigInt(0);

  if (!accountInfo) {
    return BigInt(0);
  }

  if (['Liquid'].includes(accountInfo.status as string)) {
    bnTransferable = BigInt(accountInfo.balance) - bnAppliedExistentialDeposit;
  }

  return bnTransferable;
}

export function _getAssetsPalletTransferableWithoutStatus (accountInfo: PalletAssetsAssetAccountWithoutStatus | undefined, existentialDeposit: string, strictMode?: boolean) {
  const bnAppliedExistentialDeposit = _getAppliedExistentialDeposit(existentialDeposit, strictMode);

  let bnTransferable = BigInt(0);

  if (!accountInfo) {
    return BigInt(0);
  }

  if (!accountInfo.isFrozen) {
    bnTransferable = BigInt(accountInfo.balance) - bnAppliedExistentialDeposit;
  }

  return bnTransferable;
}

export function _getAssetsPalletLockedWithStatus (accountInfo: PalletAssetsAssetAccountWithStatus | undefined) {
  let bnLocked = BigInt(0);

  if (!accountInfo) {
    return bnLocked;
  }

  if (!['Liquid'].includes(accountInfo.status as string)) {
    bnLocked = BigInt(accountInfo.balance);
  }

  return bnLocked;
}

export function _getAssetsPalletLockedWithoutStatus (accountInfo: PalletAssetsAssetAccountWithoutStatus | undefined) {
  let bnLocked = BigInt(0);

  if (!accountInfo) {
    return bnLocked;
  }

  if (accountInfo.isFrozen) {
    bnLocked = BigInt(accountInfo.balance);
  }

  return bnLocked;
}
