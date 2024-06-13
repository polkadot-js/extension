// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import BigN from 'bignumber.js';

export type PalletNominationPoolsPoolMember = {
  poolId: number,
  points: number,
  lastRecordedRewardCounter: number,
  unbondingEras: Record<string, number>
}

export function _getActiveStakeInNominationPool (memberInfo: PalletNominationPoolsPoolMember): BigN {
  return new BigN(memberInfo.points.toString());
}

export function _getUnbondingStakeInNominationPool (memberInfo: PalletNominationPoolsPoolMember): BigN {
  return new BigN(Object.values(memberInfo.unbondingEras).reduce((a, b) => a + b, 0));
}

export function _getTotalStakeInNominationPool (memberInfo: PalletNominationPoolsPoolMember): BigN {
  return _getActiveStakeInNominationPool(memberInfo).plus(_getUnbondingStakeInNominationPool(memberInfo));
}
