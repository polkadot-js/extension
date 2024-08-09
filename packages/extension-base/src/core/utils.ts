// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { BalanceAccountType } from '@subwallet/extension-base/core/substrate/types';

export function getStrictMode (type: string, extrinsicType?: ExtrinsicType) {
  if (type === BalanceAccountType.FrameSystemAccountInfo) {
    return !extrinsicType || ![ExtrinsicType.TRANSFER_BALANCE].includes(extrinsicType);
  }

  return false;
}

export function _getAppliedExistentialDeposit (existentialDeposit: string, strictMode?: boolean): bigint {
  return strictMode ? BigInt(existentialDeposit) : BigInt(0);
}

export function getMaxBigInt (a: bigint, b: bigint): bigint {
  return a > b ? a : b;
}
