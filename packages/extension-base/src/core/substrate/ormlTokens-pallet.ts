// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { BalanceAccountType, OrmlTokensAccountData } from '@subwallet/extension-base/core/substrate/types';
import { _getAppliedExistentialDeposit, getMaxBigInt, getStrictMode } from '@subwallet/extension-base/core/utils';

export function _getOrmlTokensPalletTransferable (accountInfo: OrmlTokensAccountData, existentialDeposit: string, extrinsicType?: ExtrinsicType): bigint {
  const strictMode = getStrictMode(BalanceAccountType.OrmlTokensAccountData, extrinsicType);
  const bnAppliedExistentialDeposit = _getAppliedExistentialDeposit(existentialDeposit, strictMode);

  const bnFrozen = BigInt(accountInfo.frozen);
  const bnFree = BigInt(accountInfo.free);

  return bnFree - getMaxBigInt(bnFrozen, bnAppliedExistentialDeposit);
}

export function _getOrmlTokensPalletLockedBalance (accountInfo: OrmlTokensAccountData): bigint {
  const bnFrozen = BigInt(accountInfo.frozen);
  const bnReserved = BigInt(accountInfo.reserved);

  return bnReserved + bnFrozen;
}
