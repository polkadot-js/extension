// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { _getAppliedExistentialDeposit } from '@subwallet/extension-base/core/substrate/assets-pallet';
import BigN from 'bignumber.js';

export type OrmlTokensAccountData = {
  free: number,
  reserved: number,
  frozen: number
}

export function _getOrmlTokensPalletTransferable (accountInfo: OrmlTokensAccountData, existentialDeposit: string, extrinsicType?: ExtrinsicType): string {
  const strictMode = !extrinsicType || ![ExtrinsicType.TRANSFER_TOKEN].includes(extrinsicType);
  const bnAppliedExistentialDeposit = new BigN(_getAppliedExistentialDeposit(existentialDeposit, strictMode));

  const bnFrozen = new BigN(accountInfo.frozen);
  const bnFree = new BigN(accountInfo.free);
  const bnTransferableBalance = bnFree.minus(BigN.max(bnFrozen, bnAppliedExistentialDeposit));

  return BigN.max(bnTransferableBalance, 0).toFixed();
}

export function _getOrmlTokensPalletLockedBalance (accountInfo: OrmlTokensAccountData): string {
  const bnFrozen = new BigN(accountInfo.frozen);
  const bnReserved = new BigN(accountInfo.reserved);
  const bnLocked = bnReserved.plus(bnFrozen);

  return BigN.max(bnLocked, 0).toFixed();
}
