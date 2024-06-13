import {_AssetType, _ChainAsset} from "@subwallet/chain-list/types";

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

    return slug === `${originChain}-${assetType}-${symbol}-${runeId}`;
  }

  if ([_AssetType.ERC20, _AssetType.ERC721, _AssetType.PSP22, _AssetType.PSP34, _AssetType.GRC20, _AssetType.GRC721]) {
    const contractAddress = chainAsset.metadata?.contractAddress;

    return slug === `${originChain}-${assetType}-${symbol}-${contractAddress}`;
  }

  return undefined;
}

export function validateBrigeToken (chainAsset: _ChainAsset) {
  const isBridged = chainAsset.metadata?.isBridged;
  return isBridged ? (!!chainAsset.metadata?.onChainInfo) : true;
}
