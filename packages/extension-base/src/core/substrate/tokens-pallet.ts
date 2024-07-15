// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import BigN from 'bignumber.js';

export type OrmlTokensAccountData = {
  free: number,
  reserved: number,
  frozen: number
}

export function _getTokensPalletTransferable (accountInfo: OrmlTokensAccountData, existentialDeposit: string, extrinsicType?: ExtrinsicType): string {
  const strictMode = !extrinsicType || ![ExtrinsicType.TRANSFER_TOKEN].includes(extrinsicType);
  const bnAppliedExistentialDeposit = new BigN(_getAppliedExistentialDeposit(existentialDeposit, strictMode));

  const bnFrozen = new BigN(accountInfo.frozen);
  const bnFree = new BigN(accountInfo.free);
  const bnTransferableBalance = bnFree.minus(BigN.max(bnFrozen, bnAppliedExistentialDeposit));

  return BigN.max(bnTransferableBalance, 0).toFixed();
}

export function _getTokensPalletLocked (accountInfo: OrmlTokensAccountData): string {
  const bnFrozen = new BigN(accountInfo.frozen);
  const bnReserved = new BigN(accountInfo.reserved);
  const bnLocked = bnReserved.plus(bnFrozen);

  return BigN.max(bnLocked, 0).toFixed();
}

export function _getTokensPalletTotalBalance (accountInfo: OrmlTokensAccountData): string {
  const bnReserved = new BigN(accountInfo.reserved);
  const bnFree = new BigN(accountInfo.free);
  const bnTotalBalance = bnFree.plus(bnReserved);

  return BigN.max(bnTotalBalance, 0).toFixed();
}

// ----------------------------------------------------------------------

function _getAppliedExistentialDeposit (existentialDeposit: string, strictMode?: boolean): string {
  return strictMode ? existentialDeposit : '0';
}
