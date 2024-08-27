// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

// https://crates.parity.io/frame_system/struct.AccountInfo.html
// https://wiki.polkadot.network/docs/learn-account-balances
export type FrameSystemAccountInfoV2 = Omit<FrameSystemAccountInfoV1, 'data'> & {
  data: {
    free: number,
    reserved: number,
    frozen: number,
    flags: number
  }
}

export type FrameSystemAccountInfoV1 = {
  nonce: number,
  consumers: number,
  providers: number,
  sufficients: number,
  data: {
    free: number | string,
    reserved: number,
    miscFrozen: number,
    feeFrozen: number
  }
}

export type FrameSystemAccountInfo = FrameSystemAccountInfoV1 | FrameSystemAccountInfoV2;

export type OrmlTokensAccountData = {
  free: number,
  reserved: number,
  frozen: number
}

export type PalletAssetsAssetAccountWithStatus = {
  balance: number | string,
  status: 'Frozen' | 'Liquid' | 'Blocked',
  reason: Record<string, unknown>,
  extra: unknown
}

export type PalletAssetsAssetAccountWithoutStatus = Omit<PalletAssetsAssetAccountWithStatus, 'status'> & {
  isFrozen: boolean
}

export type PalletAssetsAssetAccount = PalletAssetsAssetAccountWithStatus | PalletAssetsAssetAccountWithoutStatus

export type PalletNominationPoolsPoolMember = {
  poolId: number,
  points: number,
  lastRecordedRewardCounter: number,
  unbondingEras: Record<string, number>
}

// export type BalanceAccountType = 'FrameSystemAccountInfo' | 'OrmlTokensAccountData' | 'PalletAssetsAssetAccount' | 'PalletNominationPoolsPoolMember';
export const BalanceAccountType = {
  FrameSystemAccountInfo: 'FrameSystemAccountInfo',
  OrmlTokensAccountData: 'OrmlTokensAccountData',
  PalletAssetsAssetAccount: 'PalletAssetsAssetAccount'
};
