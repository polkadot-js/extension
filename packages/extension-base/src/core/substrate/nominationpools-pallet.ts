// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

export type PalletNominationPoolsPoolMember = {
  poolId: number,
  points: number,
  lastRecordedRewardCounter: number,
  unbondingEras: Record<string, number>
}

export function _getActiveStakeInNominationPool (memberInfo: PalletNominationPoolsPoolMember): string {
  return memberInfo.points.toString();
}
