// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import BigN from 'bignumber.js';

export type OrmlTokensAccountData = {
  free: number,
  reserved: number,
  frozen: number
}

export function _getTokensPalletTransferable (accountInfo: OrmlTokensAccountData): string {
  const bnFrozen = new BigN(accountInfo.frozen);
  const bnFree = new BigN(accountInfo.free);
  const bnTransferableBalance = bnFree.minus(bnFrozen);

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
