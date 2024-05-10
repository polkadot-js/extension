// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import BigN from 'bignumber.js';

// https://crates.parity.io/frame_system/struct.AccountInfo.html
// https://wiki.polkadot.network/docs/learn-account-balances

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
  return accountInfo.consumers === 0; // might need to check refCount
}

export function _isAccountActive (accountInfo: FrameSystemAccountInfo): boolean {
  return accountInfo.providers === 0 && accountInfo.consumers === 0;
}

export function _getSystemPalletTransferable (accountInfo: FrameSystemAccountInfo, existentialDeposit: string, strictMode?: boolean): string {
  const canBeReaped = _canAccountBeReaped(accountInfo);
  let bnAppliedExistentialDeposit;

  // strict mode will always apply existential deposit to keep account alive
  if (strictMode) {
    bnAppliedExistentialDeposit = new BigN(existentialDeposit);
  } else {
    bnAppliedExistentialDeposit = canBeReaped ? new BigN(0) : new BigN(existentialDeposit); // this will go better with max transfer
  }

  const bnFree = new BigN(accountInfo.data.free);
  const bnLocked = new BigN(accountInfo.data.frozen).minus(accountInfo.data.reserved); // locked can go below 0 but this shouldn't matter

  return bnFree.minus(BigN.max(bnLocked, bnAppliedExistentialDeposit)).toString();
}

export function _getSystemPalletTotalBalance (accountInfo: FrameSystemAccountInfo): string {
  return new BigN(accountInfo.data.free).plus(accountInfo.data.reserved).toString();
}
