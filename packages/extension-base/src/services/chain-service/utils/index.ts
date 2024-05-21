// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _AssetRef, _AssetRefPath, _AssetType, _ChainAsset, _ChainInfo, _ChainStatus, _MultiChainAsset, _SubstrateChainType } from '@subwallet/chain-list/types';
import { BasicTokenInfo } from '@subwallet/extension-base/background/KoniTypes';
import { _MANTA_ZK_CHAIN_GROUP, _ZK_ASSET_PREFIX } from '@subwallet/extension-base/services/chain-service/constants';
import { _ChainState, _CUSTOM_PREFIX, _DataMap, _SMART_CONTRACT_STANDARDS } from '@subwallet/extension-base/services/chain-service/types';
import { IChain } from '@subwallet/extension-base/services/storage-service/databases';

import { isEthereumAddress } from '@polkadot/util-crypto';

export function _isCustomChain (slug: string) {
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

export function _isPureSubstrateChain (chainInfo: _ChainInfo) {
  return (chainInfo.evmInfo === null && chainInfo.substrateInfo !== null);
}

export function _getOriginChainOfAsset (assetSlug: string) {
  if (assetSlug.startsWith(_CUSTOM_PREFIX)) {
    const arr = assetSlug.split('-').slice(1);

    if (arr[0] === 'custom') {
      const end = arr.findIndex((str) => Object.values(_AssetType).includes(str as _AssetType));

      return arr.slice(0, end).join('-');
    }

    return arr[0];
  }

  return assetSlug.split('-')[0];
}

export function _getContractAddressOfToken (tokenInfo: _ChainAsset) {
  return tokenInfo.metadata?.contractAddress as string || '';
}

/**
 * @function _isNativeTokenTransferredByEvm
 * @description Check if the native token is transferred by EVM, some token is only transferred by Substrate, need to check disableEvmTransfer flag
 * @param {_ChainAsset} tokenInfo - The token info object
 * @returns {boolean} - Return true if the native token can transfer by EVM
 * */
export function _isNativeTokenTransferredByEvm (tokenInfo: _ChainAsset) {
  return !tokenInfo.metadata?.disableEvmTransfer;
}

/**
 * @function _isTokenTransferredByEvm
 * @description Check if the token is transferred by EVM
 * @param {_ChainAsset} tokenInfo - The token info object
 * @returns {boolean} - Return true if the token can transfer by EVM
 * */
export function _isTokenTransferredByEvm (tokenInfo: _ChainAsset) {
  return !!tokenInfo.metadata?.contractAddress || (_isNativeToken(tokenInfo) && _isNativeTokenTransferredByEvm(tokenInfo));
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

export function _isBridgedToken (tokenInfo: _ChainAsset) {
  return tokenInfo.metadata?.isBridged as boolean;
}

export function _getTokenMinAmount (tokenInfo: _ChainAsset) {
  return tokenInfo.minAmount || '0';
}

export function _isChainEvmCompatible (chainInfo: _ChainInfo) {
  return !!chainInfo.evmInfo;
}

export function _isNativeToken (tokenInfo: _ChainAsset) {
  return tokenInfo.assetType === _AssetType.NATIVE;
}

export function _isNativeTokenBySlug (tokenSlug: string) {
  return tokenSlug.includes(_AssetType.NATIVE as string);
}

export function _isSmartContractToken (tokenInfo: _ChainAsset) {
  return _SMART_CONTRACT_STANDARDS.includes(tokenInfo.assetType);
}

export function _isSubstrateChain (chainInfo: _ChainInfo) {
  return !!chainInfo.substrateInfo; // fallback to Ethereum
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

export function _getChainSubstrateAddressPrefix (chainInfo: _ChainInfo) {
  return chainInfo?.substrateInfo?.addressPrefix ?? -1;
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

export function _isChainSupportEvmERC20 (chainInfo: _ChainInfo) {
  return chainInfo.evmInfo?.supportSmartContract?.includes(_AssetType.ERC20) || false;
}

export function _isChainSupportWasmPSP22 (chainInfo: _ChainInfo) {
  return chainInfo.substrateInfo?.supportSmartContract?.includes(_AssetType.PSP22) || false;
}

export function _isChainSupportGRC20 (chainInfo: _ChainInfo) {
  return chainInfo.substrateInfo?.supportSmartContract?.includes(_AssetType.GRC20) || false;
}

export const _isSupportOrdinal = (chain: string) => {
  const chains = ['polkadot', 'astar', 'bifrost_dot', 'moonbeam'];

  return chains.includes(chain);
};

export function _getNftTypesSupportedByChain (chainInfo: _ChainInfo): _AssetType[] {
  const result: _AssetType[] = [];

  if (chainInfo.substrateInfo && chainInfo.substrateInfo.supportSmartContract) {
    chainInfo.substrateInfo.supportSmartContract.forEach((assetType) => {
      if ([_AssetType.PSP34].includes(assetType)) {
        result.push(assetType);
      }
    });
  }

  if (chainInfo.evmInfo && chainInfo.evmInfo.supportSmartContract) {
    chainInfo.evmInfo.supportSmartContract.forEach((assetType) => {
      if ([_AssetType.ERC721].includes(assetType)) {
        result.push(assetType);
      }
    });
  }

  return result;
}

export function _getTokenTypesSupportedByChain (chainInfo: _ChainInfo): _AssetType[] {
  const result: _AssetType[] = [];

  if (chainInfo.substrateInfo && chainInfo.substrateInfo.supportSmartContract) {
    chainInfo.substrateInfo.supportSmartContract.forEach((assetType) => {
      if ([_AssetType.PSP22, _AssetType.GRC20].includes(assetType)) {
        result.push(assetType);
      }
    });
  }

  if (chainInfo.evmInfo && chainInfo.evmInfo.supportSmartContract) {
    chainInfo.evmInfo.supportSmartContract.forEach((assetType) => {
      if ([_AssetType.ERC20].includes(assetType)) {
        result.push(assetType);
      }
    });
  }

  return result;
}

export function _getChainNativeTokenBasicInfo (chainInfo: _ChainInfo): BasicTokenInfo {
  if (!chainInfo) {
    return {
      symbol: '',
      decimals: -1
    };
  }

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
  if (_isCustomChain(chainInfo.slug)) {
    return `${_CUSTOM_PREFIX}${chainInfo.slug}-${_AssetType.NATIVE}-${_getChainNativeTokenBasicInfo(chainInfo).symbol}`;
  }

  return `${chainInfo.slug}-${_AssetType.NATIVE}-${_getChainNativeTokenBasicInfo(chainInfo).symbol}`;
}

export function _isLocalToken (tokenInfo: _ChainAsset) {
  return tokenInfo.assetType === _AssetType.LOCAL;
}

export function _isTokenEvmSmartContract (tokenInfo: _ChainAsset) {
  return [_AssetType.ERC721, _AssetType.ERC20].includes(tokenInfo.assetType);
}

export function _isTokenWasmSmartContract (tokenInfo: _ChainAsset) {
  return [_AssetType.PSP22, _AssetType.PSP34].includes(tokenInfo.assetType);
}

export function _isAssetSmartContractNft (assetInfo: _ChainAsset) {
  return [_AssetType.PSP34, _AssetType.ERC721].includes(assetInfo.assetType);
}

export function _isTokenGearSmartContract (tokenInfo: _ChainAsset) {
  return [_AssetType.GRC20, _AssetType.GRC721].includes(tokenInfo.assetType);
}

export function _parseAssetRefKey (originTokenSlug: string, destinationTokenSlug: string) {
  return `${originTokenSlug}___${destinationTokenSlug}`;
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

export function _getXcmAssetMultilocation (tokenInfo: _ChainAsset) {
  return tokenInfo.metadata?.multilocation as Record<string, any>;
}

export function _getXcmTransferType (originChainInfo: _ChainInfo, destinationChainInfo: _ChainInfo) {
  return `${originChainInfo.substrateInfo?.chainType || ''}-${destinationChainInfo.substrateInfo?.chainType || ''}`;
}

export function _isSubstrateRelayChain (chainInfo: _ChainInfo) {
  return chainInfo.substrateInfo?.chainType === _SubstrateChainType.RELAYCHAIN;
}

export function _isSubstrateParaChain (chainInfo: _ChainInfo) {
  return chainInfo.substrateInfo !== null && chainInfo.substrateInfo.paraId !== null && chainInfo.substrateInfo?.chainType === _SubstrateChainType.PARACHAIN;
}

export function _getEvmAbiExplorer (chainInfo: _ChainInfo) {
  return chainInfo.evmInfo?.abiExplorer || '';
}

export function _isAssetValuable (assetInfo: _ChainAsset) {
  return assetInfo.hasValue;
}

export function _getMultiChainAsset (assetInfo?: _ChainAsset) {
  return assetInfo?.multiChainAsset || '';
}

export function _getAssetPriceId (assetInfo?: _ChainAsset) {
  return assetInfo?.priceId || '';
}

export function _getAssetName (assetInfo?: _ChainAsset) {
  return assetInfo?.name || '';
}

export function _getMultiChainAssetPriceId (multiChainAsset: _MultiChainAsset) {
  return multiChainAsset?.priceId || '';
}

export function _getAssetSymbol (assetInfo?: _ChainAsset) {
  return assetInfo?.symbol || '';
}

export function _getMultiChainAssetSymbol (multiChainAsset: _MultiChainAsset) {
  return multiChainAsset.symbol;
}

export function _getAssetOriginChain (assetInfo?: _ChainAsset) {
  return assetInfo?.originChain || '';
}

export function _getChainName (chainInfo: _ChainInfo) {
  return chainInfo.name;
}

export function _getAssetDecimals (assetInfo?: _ChainAsset): number {
  return assetInfo?.decimals || 0;
}

export function _getBlockExplorerFromChain (chainInfo: _ChainInfo): string | undefined {
  let blockExplorer;

  if (!chainInfo) {
    return;
  }

  if (_isPureEvmChain(chainInfo)) {
    blockExplorer = chainInfo?.evmInfo?.blockExplorer;
  } else {
    blockExplorer = chainInfo?.substrateInfo?.blockExplorer;
  }

  if (!blockExplorer) {
    return undefined;
  }

  if (blockExplorer !== '' && !blockExplorer.endsWith('/')) {
    return `${blockExplorer}/`;
  } else {
    return blockExplorer;
  }
}

export function _parseMetadataForSmartContractAsset (contractAddress: string): Record<string, string> {
  return {
    contractAddress
  };
}

export function _isChainTestNet (chainInfo: _ChainInfo): boolean {
  return chainInfo.isTestnet || false;
}

export function _isAssetFungibleToken (chainAsset: _ChainAsset): boolean {
  return ![_AssetType.ERC721, _AssetType.PSP34, _AssetType.UNKNOWN].includes(chainAsset.assetType);
}

export const _isAssetAutoEnable = (chainAsset: _ChainAsset): boolean => {
  return chainAsset.metadata ? !!chainAsset.metadata.autoEnable : false;
};

export function _getCrowdloanUrlFromChain (chainInfo: _ChainInfo): string {
  return chainInfo?.substrateInfo?.crowdloanUrl || '';
}

export function _isCustomProvider (providerKey: string) {
  return providerKey.startsWith(_CUSTOM_PREFIX);
}

export function _generateCustomProviderKey (index: number) {
  return `${_CUSTOM_PREFIX}provider-${index}`;
}

export const findChainInfoByHalfGenesisHash = (chainMap: Record<string, _ChainInfo>, halfGenesisHash?: string): _ChainInfo | null => {
  if (!halfGenesisHash) {
    return null;
  }

  for (const chainInfo of Object.values(chainMap)) {
    if (_getSubstrateGenesisHash(chainInfo)?.toLowerCase().substring(2, 2 + 32) === halfGenesisHash.toLowerCase()) {
      return chainInfo;
    }
  }

  return null;
};

export const findChainInfoByChainId = (chainMap: Record<string, _ChainInfo>, chainId?: number): _ChainInfo | null => {
  if (!chainId) {
    return null;
  }

  for (const chainInfo of Object.values(chainMap)) {
    if (chainInfo.evmInfo?.evmChainId === chainId) {
      return chainInfo;
    }
  }

  return null;
};

export function _isMantaZkAsset (chainAsset: _ChainAsset) {
  return _MANTA_ZK_CHAIN_GROUP.includes(chainAsset.originChain) && chainAsset.symbol.startsWith(_ZK_ASSET_PREFIX);
}

export function randomizeProvider (providers: Record<string, string>, excludedKeys?: string[]) {
  if (Object.keys(providers).length === 0) {
    return {
      providerKey: '',
      providerValue: ''
    };
  }

  let isValid = false;
  let selectedProviderKey = '';
  let selectedProviderValue = '';

  while (!isValid) {
    const randomProvider = Math.floor(Math.random() * (Object.keys(providers).length));

    selectedProviderKey = Object.keys(providers)[randomProvider];
    selectedProviderValue = providers[selectedProviderKey];

    if (!selectedProviderValue?.startsWith('light') && !selectedProviderKey?.startsWith(_CUSTOM_PREFIX) && !excludedKeys?.includes(selectedProviderKey)) { // if it's light client, then re-randomize
      isValid = true;
    }
  }

  return {
    providerKey: selectedProviderKey,
    providerValue: selectedProviderValue
  };
}

export function _isAssetCanPayTxFee (chainAsset: _ChainAsset): boolean {
  return chainAsset.metadata?.canPayTxFee as boolean ?? false;
}

export function updateLatestChainInfo (currentDataMap: _DataMap, latestChainInfoList: _ChainInfo[]) {
  const currentChainInfoMap = currentDataMap.chainInfoMap;
  const currentChainStateMap = currentDataMap.chainStateMap;
  const storedChainInfoList: IChain[] = [];
  const needUpdateChainApiList: _ChainInfo[] = [];

  for (const latestChainInfo of latestChainInfoList) {
    const currentChainInfo = currentChainInfoMap[latestChainInfo.slug];
    const currentChainState = currentChainStateMap[latestChainInfo.slug];
    const currentChainProviderValue = currentChainInfo?.providers[currentChainState?.currentProvider];
    let needUpdate = false;

    if (currentChainInfo && currentChainState) {
      const preservedProvider: Record<string, string> = {};

      Object.entries(currentChainInfo.providers).forEach(([providerKey, providerValue]) => {
        if (providerValue?.startsWith('light') || providerKey?.startsWith(_CUSTOM_PREFIX)) {
          preservedProvider[providerKey] = providerValue;
        }
      });

      currentChainInfo.providers = { ...latestChainInfo.providers, ...preservedProvider };

      const currentProviderNotFound = !Object.keys(currentChainInfo.providers).includes(currentChainState.currentProvider);
      const currentProviderUpdated = Object.keys(currentChainInfo.providers).includes(currentChainState.currentProvider) && !Object.values(currentChainInfo.providers).includes(currentChainProviderValue);

      if (currentChainInfo.chainStatus === _ChainStatus.ACTIVE && (currentProviderNotFound || currentProviderUpdated)) {
        const { providerKey } = randomizeProvider(currentChainInfo.providers);

        currentChainState.currentProvider = providerKey;

        if (currentChainState.active) {
          needUpdateChainApiList.push(currentChainInfo);
        }
      }

      needUpdate = true;
    }

    if (currentChainInfo) {
      needUpdate = true;
      currentChainInfo.extraInfo = latestChainInfo.extraInfo;
      currentChainInfo.chainStatus = latestChainInfo.chainStatus;

      if (Object.keys(currentChainInfo.providers).length === 0) {
        currentChainInfo.chainStatus = _ChainStatus.INACTIVE;
      }
    }

    if (needUpdate) {
      storedChainInfoList.push({
        ...currentChainInfo,
        ...currentChainState
      });
    }
  }

  return {
    storedChainInfoList,
    needUpdateChainApiList
  };
}

export * from './patch';
