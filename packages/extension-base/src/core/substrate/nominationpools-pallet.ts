// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { PalletNominationPoolsPoolMember } from '@subwallet/extension-base/core/substrate/types';
import BigN from 'bignumber.js';

export function _getActiveStakeInNominationPool (memberInfo: PalletNominationPoolsPoolMember): BigN {
  return new BigN(memberInfo.points.toString());
}

export function _getUnbondingStakeInNominationPool (memberInfo: PalletNominationPoolsPoolMember): BigN {
  const unbondingValues: BigN[] = Object.values(memberInfo.unbondingEras).map((unbonding) => new BigN(unbonding));

  return new BigN(Object.values(unbondingValues).reduce((a, b) => a.plus(b), new BigN(0)));
}

export function _getTotalStakeInNominationPool (memberInfo: PalletNominationPoolsPoolMember): BigN {
  return _getActiveStakeInNominationPool(memberInfo).plus(_getUnbondingStakeInNominationPool(memberInfo));
}
