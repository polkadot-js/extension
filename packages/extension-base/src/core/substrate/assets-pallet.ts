// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { PalletAssetsAssetAccount } from '@subwallet/extension-base/core/substrate/types';
import BigN from 'bignumber.js';

export function _getAssetsPalletTransferable (accountInfo: PalletAssetsAssetAccount | undefined, existentialDeposit: string, extrinsicType?: ExtrinsicType): string {
  const strictMode = !extrinsicType || ![ExtrinsicType.TRANSFER_TOKEN, ExtrinsicType.TRANSFER_BALANCE].includes(extrinsicType);
  const bnAppliedExistentialDeposit = new BigN(_getAppliedExistentialDeposit(existentialDeposit, strictMode));

  let bnTransferable = new BigN(0);

  if (!accountInfo) {
    return '0';
  }

  if (['Liquid'].includes(accountInfo.status as string)) {
    bnTransferable = new BigN(accountInfo.balance).minus(bnAppliedExistentialDeposit);
  }

  return BigN.max(bnTransferable, 0).toFixed();
}

export function _getAssetsPalletLockedBalance (accountInfo: PalletAssetsAssetAccount | undefined): string {
  let bnFrozen = new BigN(0);

  if (!accountInfo) {
    return '0';
  }

  if (!['Liquid'].includes(accountInfo.status as string)) { // todo: check case accountInfo has isFrozen?
    bnFrozen = new BigN(accountInfo.balance);
  }

  return BigN.max(bnFrozen, 0).toFixed();
}

// ----------------------------------------------------------------------

export function _getAppliedExistentialDeposit (existentialDeposit: string, strictMode?: boolean): string {
  return strictMode ? existentialDeposit : '0';
}
