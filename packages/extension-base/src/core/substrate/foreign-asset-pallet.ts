// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { BalanceAccountType, PalletAssetsAssetAccount } from '@subwallet/extension-base/core/substrate/types';
import { _getAppliedExistentialDeposit, getStrictMode } from '@subwallet/extension-base/core/utils';

export function _getForeignAssetPalletTransferable (accountInfo: PalletAssetsAssetAccount | undefined, existentialDeposit: string, extrinsicType?: ExtrinsicType): bigint {
  const strictMode = getStrictMode(BalanceAccountType.PalletAssetsAssetAccount, extrinsicType);

  if (!accountInfo || accountInfo.status !== 'Liquid') {
    return BigInt(0);
  }

  const bnAppliedExistentialDeposit = _getAppliedExistentialDeposit(existentialDeposit, strictMode);

  return BigInt(accountInfo.balance) - bnAppliedExistentialDeposit;
}

export function _getForeignAssetPalletLockedBalance (accountInfo: PalletAssetsAssetAccount | undefined): bigint {
  if (!accountInfo || accountInfo.status === 'Liquid') {
    return BigInt(0);
  }

  return BigInt(accountInfo.balance);
}
