// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { Asset, Assets, Chain, Chains } from '@chainflip/sdk/swap';

export function chainFlipConvertChainId (chainSlug: string): Chain {
  // todo: more logic here
  return (chainSlug[0].toUpperCase() + chainSlug.slice(1)) as Chain;
}

export const CHAIN_FLIP_SUPPORTED_CHAIN_MAPPING: Record<string, Chain> = {
  polkadot: Chains.Polkadot,
  ethereum: Chains.Ethereum
};

export const CHAIN_FLIP_SUPPORTED_ASSET_MAPPING: Record<string, Asset> = {
  'polkadot-NATIVE-DOT': Assets.DOT,
  'ethereum-NATIVE-ETH': Assets.ETH,
  'ethereum-ERC20-USDC-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': Assets.USDC
};
