// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AssetSpec } from '@subwallet/extension-base/services/chain-service/health-check/utils/asset-info';

export interface NativeAssetInfo {
  decimals: number;
  existentialDeposit: string;
  symbol: string;
}

export const checkNativeAsset = (
  assetInfo: AssetSpec,
  nativeAsset: NativeAssetInfo
) => {
  const { decimals: _decimals, existentialDeposit: _minAmount, symbol: _symbol } = nativeAsset;
  const { decimals, minAmount, symbol } = assetInfo;

  return (
    minAmount === _minAmount &&
    symbol === _symbol &&
    decimals === _decimals
  );
};

export const checkSs58Prefix = (onchainPrefix: number, chainlistPrefix: number) => {
  return onchainPrefix === chainlistPrefix;
};

export const checkParachainId = (onchainPrefix: number | null, chainlistPrefix: number | null) => {
  return onchainPrefix === chainlistPrefix;
};
