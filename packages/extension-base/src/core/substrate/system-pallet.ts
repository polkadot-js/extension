// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

// https://crates.parity.io/frame_system/struct.AccountInfo.html
import BigN from 'bignumber.js';

export interface FrameSystemAccountInfo {
  nonce: number,
  consumers: number,
  providers: number,
  sufficients: number,
  data: {
    free: number,
    reserved: number,
    frozen: number,
    flags: number
  }
}

export function _canAccountBeReaped (accountInfo: FrameSystemAccountInfo): boolean {
  return accountInfo.consumers === 0;
}

export function _isAccountActive (accountInfo: FrameSystemAccountInfo): boolean {
  return accountInfo.providers === 0 && accountInfo.consumers === 0;
}

export function _isAccountSufficient (accountInfo: FrameSystemAccountInfo): boolean {
  return accountInfo.sufficients > 0;
}

export function _getSystemPalletTransferable (accountInfo: FrameSystemAccountInfo, existentialDeposit: string): string {
  const bnExistentialDeposit = new BigN(existentialDeposit);
  const bnFree = new BigN(accountInfo.data.free);
  const bnLocked = new BigN(accountInfo.data.frozen).minus(accountInfo.data.reserved);

  return bnFree.minus(BigN.max(bnLocked, bnExistentialDeposit)).toString();
}

export function _getSystemPalletTotalBalance (accountInfo: FrameSystemAccountInfo): string {
  return new BigN(accountInfo.data.free).plus(accountInfo.data.reserved).toString();
}
