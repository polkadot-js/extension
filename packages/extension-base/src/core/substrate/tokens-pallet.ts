// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { BalanceAccountType, OrmlTokensAccountData } from '@subwallet/extension-base/core/substrate/types';
import { _getAppliedExistentialDeposit, getMaxBigInt, getStrictMode } from '@subwallet/extension-base/core/utils';

export function _getTokensPalletTransferable (accountInfo: OrmlTokensAccountData, existentialDeposit: string, extrinsicType?: ExtrinsicType): bigint {
  const strictMode = getStrictMode(BalanceAccountType.OrmlTokensAccountData, extrinsicType);
  const bnAppliedExistentialDeposit = _getAppliedExistentialDeposit(existentialDeposit, strictMode);

  return BigInt(accountInfo.free) - getMaxBigInt(BigInt(accountInfo.frozen), bnAppliedExistentialDeposit);
}

export function _getTokensPalletLocked (accountInfo: OrmlTokensAccountData): bigint {
  return BigInt(accountInfo.reserved) + BigInt(accountInfo.frozen);
}

export function _getTokensPalletTotalBalance (accountInfo: OrmlTokensAccountData): bigint {
  return BigInt(accountInfo.free) + BigInt(accountInfo.reserved);
}
