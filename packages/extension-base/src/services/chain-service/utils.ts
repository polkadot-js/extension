// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _AssetRef, _AssetRefPath, _AssetType, _ChainAsset, _ChainInfo, _SubstrateChainType } from '@subwallet/chain-list/types';
import { _ChainState, _CUSTOM_PREFIX, _SMART_CONTRACT_STANDARDS } from '@subwallet/extension-base/services/chain-service/types';

import { isEthereumAddress } from '@polkadot/util-crypto';

export function _isCustomNetwork (slug: string) {
  if (slug.length === 0) {
    return true;
  }

  return slug.startsWith(_CUSTOM_PREFIX);
}

export function _isCustomAsset (slug: string) { // might be different from _isCustomNetwork
  if (slug.length === 0) {
    return true;
  }

  return slug.startsWith(_CUSTOM_PREFIX);
}

export function _getCustomAssets (assetRegistry: Record<string, _ChainAsset>): Record<string, _ChainAsset> {
  const filteredAssetMap: Record<string, _ChainAsset> = {};

  Object.values(assetRegistry).forEach((chainAsset) => {
    if (_isCustomAsset(chainAsset.slug)) {
      filteredAssetMap[chainAsset.slug] = chainAsset;
    }
  });

  return filteredAssetMap;
}

export function _isEqualContractAddress (address1: string, address2: string) {
  if (isEthereumAddress(address1) && isEthereumAddress(address2)) {
    return address1.toLowerCase() === address2.toLowerCase(); // EVM address is case-insensitive
  }

  return address2 === address1;
}

export function _isEqualSmartContractAsset (asset1: _ChainAsset, asset2: _ChainAsset) {
  const contract1 = asset1.metadata?.contractAddress as string || undefined || null;
  const contract2 = asset2.metadata?.contractAddress as string || undefined || null;

  if (!contract1 || !contract2) {
    return false;
  }

  if (_isEqualContractAddress(contract1, contract2) && asset1.assetType === asset2.assetType && asset1.originChain === asset2.originChain) {
    return true;
  }

  return false;
}

export function _isPureEvmChain (chainInfo: _ChainInfo) {
  return (chainInfo.evmInfo !== null && chainInfo.substrateInfo === null);
}

export function _getOriginChainOfAsset (assetSlug: string) {
  return assetSlug.split('-')[0];
}

export function _getContractAddressOfToken (tokenInfo: _ChainAsset) {
  return tokenInfo.metadata?.contractAddress as string || '';
}

export function _checkSmartContractSupportByChain (chainInfo: _ChainInfo, contractType: _AssetType) {
  // EVM chains support smart contract by default so just checking Substrate chains
  if (chainInfo.substrateInfo === null || (chainInfo.substrateInfo && chainInfo.substrateInfo.supportSmartContract === null)) {
    return false;
  }

  return (chainInfo.substrateInfo.supportSmartContract !== null && chainInfo.substrateInfo.supportSmartContract.includes(contractType));
}

// Utils for balance functions
export function _getTokenOnChainAssetId (tokenInfo: _ChainAsset): string {
  return tokenInfo.metadata?.assetId as string || '-1';
}

export function _getTokenOnChainInfo (tokenInfo: _ChainAsset): Record<string, any> {
  return tokenInfo.metadata?.onChainInfo as Record<string, any>;
}

export function _getTokenMinAmount (tokenInfo: _ChainAsset) {
  return tokenInfo.minAmount || '0';
}

export function _isChainEvmCompatible (chainInfo: _ChainInfo) {
  return chainInfo.evmInfo !== undefined && chainInfo.evmInfo !== null;
}

export function _isNativeToken (tokenInfo: _ChainAsset) {
  return tokenInfo.assetType === _AssetType.NATIVE;
}

export function _isSmartContractToken (tokenInfo: _ChainAsset) {
  return _SMART_CONTRACT_STANDARDS.includes(tokenInfo.assetType);
}

export function _getEvmChainId (chainInfo: _ChainInfo) {
  return chainInfo.evmInfo?.evmChainId || 1; // fallback to Ethereum
}

export function _getSubstrateParaId (chainInfo: _ChainInfo) {
  return chainInfo.substrateInfo?.paraId || -1;
}

export function _getSubstrateRelayParent (chainInfo: _ChainInfo) {
  return chainInfo.substrateInfo?.relaySlug || '';
}

export function _getSubstrateGenesisHash (chainInfo: _ChainInfo) {
  return chainInfo.substrateInfo?.genesisHash || '';
}

export function _isChainSupportSubstrateStaking (chainInfo: _ChainInfo) {
  return chainInfo.substrateInfo?.supportStaking || false;
}

export function _isChainEnabled (chainState: _ChainState) {
  return chainState.active;
}

export function _isSubstrateParachain (chainInfo: _ChainInfo) {
  return chainInfo.substrateInfo !== null && chainInfo.substrateInfo.paraId !== null;
}

export function _getChainSubstrateAddressPrefix (chainInfo: _ChainInfo) {
  return chainInfo.substrateInfo?.addressPrefix || -1;
}

export function _isChainSupportNativeNft (chainInfo: _ChainInfo) {
  return chainInfo.substrateInfo?.hasNativeNft || false;
}

export function _isChainSupportEvmNft (chainInfo: _ChainInfo) {
  return chainInfo.evmInfo?.supportSmartContract?.includes(_AssetType.ERC721) || false;
}

export function _isChainSupportWasmNft (chainInfo: _ChainInfo) {
  return chainInfo.substrateInfo?.supportSmartContract?.includes(_AssetType.PSP34) || false;
}

export function _getChainNativeTokenBasicInfo (chainInfo: _ChainInfo) {
  if (chainInfo.substrateInfo !== null) { // substrate by default
    return {
      symbol: chainInfo.substrateInfo.symbol,
      decimals: chainInfo.substrateInfo.decimals
    };
  } else if (chainInfo.evmInfo !== null) {
    return {
      symbol: chainInfo.evmInfo.symbol,
      decimals: chainInfo.evmInfo.decimals
    };
  }

  return {
    symbol: '',
    decimals: -1
  };
}

export function _getChainNativeTokenSlug (chainInfo: _ChainInfo) {
  return `${chainInfo.slug}-${_AssetType.NATIVE}-${_getChainNativeTokenBasicInfo(chainInfo).symbol}`;
}

export function _isTokenEvmSmartContract (tokenInfo: _ChainAsset) {
  if ([_AssetType.ERC721, _AssetType.ERC20].includes(tokenInfo.assetType)) {
    return true;
  }

  return false;
}

export function _isTokenWasmSmartContract (tokenInfo: _ChainAsset) {
  if ([_AssetType.PSP22, _AssetType.PSP34].includes(tokenInfo.assetType)) {
    return true;
  }

  return false;
}

export function _parseAssetRefKey (originTokenSlug: string, destinationTokenSlug: string) {
  return `${originTokenSlug}-${destinationTokenSlug}`;
}

export function _isXcmPathSupported (originTokenSlug: string, destinationTokenSlug: string, assetRefMap: Record<string, _AssetRef>) {
  const assetRef = assetRefMap[_parseAssetRefKey(originTokenSlug, destinationTokenSlug)];

  if (!assetRef) {
    return false;
  }

  return (assetRef.path === _AssetRefPath.XCM);
}

export function _getXcmAssetType (tokenInfo: _ChainAsset) {
  return tokenInfo.metadata?.assetType as string || '';
}

export function _getXcmAssetId (tokenInfo: _ChainAsset) {
  return tokenInfo.metadata?.assetId as string || '-1';
}

export function _getXcmTransferType (originChainInfo: _ChainInfo, destinationChainInfo: _ChainInfo) {
  return `${originChainInfo.substrateInfo?.chainType || ''}-${destinationChainInfo.substrateInfo?.chainType || ''}`;
}

export function _getXcmAssetMultilocation (tokenInfo: _ChainAsset) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return tokenInfo.metadata?.xcmMultilocation || {};
}

export function _isSubstrateRelayChain (chainInfo: _ChainInfo) {
  return chainInfo.substrateInfo?.chainType === _SubstrateChainType.RELAYCHAIN;
}

export function _isSubstrateParaChain (chainInfo: _ChainInfo) {
  return chainInfo.substrateInfo?.chainType === _SubstrateChainType.PARACHAIN;
}

export function _getEvmAbiExplorer (chainInfo: _ChainInfo) {
  return chainInfo.evmInfo?.abiExplorer || '';
}

export function _isAssetValuable (assetInfo: _ChainAsset) {
  return assetInfo.hasValue;
}
