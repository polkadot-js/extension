// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { BalanceAccountType, PalletAssetsAssetAccount } from '@subwallet/extension-base/core/substrate/types';
import { _getAppliedExistentialDeposit, getStrictMode } from '@subwallet/extension-base/core/utils';

export function _getAssetsPalletTransferable (accountInfo: PalletAssetsAssetAccount | undefined, existentialDeposit: string, extrinsicType?: ExtrinsicType): bigint {
  const strictMode = getStrictMode(BalanceAccountType.PalletAssetsAssetAccount, extrinsicType);
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

export function _getAssetsPalletLockedBalance (accountInfo: PalletAssetsAssetAccount | undefined): bigint {
  let bnLocked = BigInt(0);

  if (!accountInfo) {
    return bnLocked;
  }

  if (!['Liquid'].includes(accountInfo.status as string)) { // todo: check case accountInfo has isFrozen?
    bnLocked = BigInt(accountInfo.balance);
  }

  return bnLocked;
}
