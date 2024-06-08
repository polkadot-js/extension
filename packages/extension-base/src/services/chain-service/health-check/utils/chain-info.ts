// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BIG_TEN } from '@subwallet/extension-base/services/chain-service/health-check/constants';
import { AssetSpec } from '@subwallet/extension-base/services/chain-service/health-check/utils/asset-info';
import BigN from 'bignumber.js';

export interface NativeAssetInfo {
  decimals: number;
  existentialDeposit: string;
  symbol: string;
}

export const checkNativeAsset = (
  assetInfo: AssetSpec,
  nativeAsset: NativeAssetInfo,
  errors: string[]
) => {
  const { decimals: _decimals, existentialDeposit: _minAmount, symbol: _symbol } = nativeAsset;
  const { decimals, minAmount, symbol } = assetInfo;

  if (minAmount !== _minAmount) {
    const convert = new BigN(minAmount).dividedBy(BIG_TEN.pow(decimals)).toFixed();
    const _convert = new BigN(_minAmount ?? '0').dividedBy(BIG_TEN.pow(_decimals)).toFixed();

    errors.push(`Wrong min amount: current - ${_minAmount} (${_convert}), onChain - ${minAmount} (${convert})`);
  }

  if (symbol !== _symbol) {
    errors.push(`Wrong symbol: current - ${_symbol}, onChain - ${symbol}`);
  }

  if (decimals !== _decimals) {
    errors.push(`Wrong decimals: current - ${_decimals}, onChain - ${decimals}`);
  }
};

export const checkSs58Prefix = (onchainPrefix: number, chainlistPrefix: number, errors: string[]) => {
  if (onchainPrefix !== chainlistPrefix) {
    errors.push(`Wrong addressPrefix: current - ${chainlistPrefix}, onChain - ${onchainPrefix}`);
  }
};

export const checkParachainId = (onchainPrefix: number | null, chainlistPrefix: number | null, errors: string[]) => {
  if (onchainPrefix !== chainlistPrefix) {
    errors.push(`Wrong paraChainId: current - ${chainlistPrefix ?? 'null'}, onChain - ${onchainPrefix ?? 'null'}`);
  }
};
