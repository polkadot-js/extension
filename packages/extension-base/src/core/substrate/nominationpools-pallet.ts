// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { PalletNominationPoolsPoolMember } from '@subwallet/extension-base/core/substrate/types';

export function _getActiveStakeInNominationPool (memberInfo: PalletNominationPoolsPoolMember): bigint {
  return BigInt(memberInfo.points);
}

export function _getUnbondingStakeInNominationPool (memberInfo: PalletNominationPoolsPoolMember): bigint {
  const unbondingValues = Object.values(memberInfo.unbondingEras).map((unbonding) => BigInt(unbonding));

  return unbondingValues.reduce((a, b) => a + b, BigInt(0));
}

export function _getTotalStakeInNominationPool (memberInfo: PalletNominationPoolsPoolMember): bigint {
  return _getActiveStakeInNominationPool(memberInfo) + _getUnbondingStakeInNominationPool(memberInfo);
}
