// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _AssetType, _ChainAsset } from '@subwallet/chain-list/types';

export function validateAssetSlug (chainAsset: _ChainAsset) {
  const slug = chainAsset.slug;
  const originChain = chainAsset.originChain;
  const assetType = chainAsset.assetType;
  const symbol = chainAsset.symbol;

  if ([_AssetType.LOCAL, _AssetType.NATIVE, _AssetType.BRC20].includes(assetType)) {
    return slug === `${originChain}-${assetType}-${symbol}`;
  }

  if ([_AssetType.RUNE].includes(assetType)) {
    const runeId = chainAsset.metadata?.runeId;

    if (!runeId) {
      throw new Error(`${slug} is ${assetType} but lack of runeId metadata`);
    }

    return slug === `${originChain}-${assetType}-${symbol}-${runeId}`;
  }

  if ([_AssetType.ERC20, _AssetType.ERC721, _AssetType.PSP22, _AssetType.PSP34, _AssetType.GRC20, _AssetType.GRC721].includes(assetType)) {
    const contractAddress = chainAsset.metadata?.contractAddress;

    if (!contractAddress) {
      throw new Error(`${slug} is ${assetType} but lack of contractAddress metadata`);
    }

    return slug === `${originChain}-${assetType}-${symbol}-${contractAddress}`;
  }

  throw new Error(`${slug} has unknown token type ${assetType}`);
}

export function validateBrigeToken (chainAsset: _ChainAsset) {
  const isBridged = chainAsset.metadata?.isBridged;

  if (!isBridged) {
    throw new Error(`${chainAsset.slug} is not bridged token`);
  }

  return !!chainAsset.metadata?.onChainInfo;
}
