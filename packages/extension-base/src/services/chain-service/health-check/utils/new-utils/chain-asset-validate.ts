// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainInfoMap } from '@subwallet/chain-list';
import { _AssetType, _ChainAsset } from '@subwallet/chain-list/types';

export function validateTokenHasValueByChain (chainAsset: _ChainAsset) {
  const chainInfo = ChainInfoMap[chainAsset.originChain];
  const isTestnet = chainInfo && chainInfo.isTestnet;

  if (!chainInfo) {
    throw new Error(`${chainAsset.originChain} is not existed`);
  }

  return isTestnet !== chainAsset.hasValue; // todo: also check multichainAsset hasValue if has.
}

export function validateNativeInfoByChain (chainAsset: _ChainAsset) {
  const chainInfo = ChainInfoMap[chainAsset.originChain];

  if (!chainInfo) {
    throw new Error(`${chainAsset.originChain} is not existed`);
  }

  const nativeSymbol = chainInfo?.evmInfo ? chainInfo?.evmInfo?.symbol : chainInfo?.substrateInfo ? chainInfo?.substrateInfo?.symbol : chainInfo?.bitcoinInfo?.symbol;
  const nativeDecimal = chainInfo?.evmInfo ? chainInfo?.evmInfo?.decimals : chainInfo?.substrateInfo ? chainInfo?.substrateInfo?.decimals : chainInfo?.bitcoinInfo?.decimals;
  const nativeED = chainInfo?.evmInfo ? chainInfo?.evmInfo?.existentialDeposit : chainInfo?.substrateInfo ? chainInfo?.substrateInfo?.existentialDeposit : chainInfo?.bitcoinInfo?.existentialDeposit;
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  const nativeTokenSlug = `${chainInfo.slug}-NATIVE-${nativeSymbol}`;

  return nativeSymbol === chainAsset.symbol && nativeDecimal === chainAsset.decimals && nativeED === chainAsset.minAmount && nativeTokenSlug === chainAsset.slug;
}

export function validateAssetTypeSupportByChain (chainAsset: _ChainAsset) {
  const chainInfo = ChainInfoMap[chainAsset.originChain];

  if (!chainInfo) {
    throw new Error(`${chainAsset.originChain} is not existed`);
  }

  const bitcoinSupportAssetTypes = [_AssetType.NATIVE, _AssetType.RUNE, _AssetType.BRC20];
  const evmSupportAssetTypes = [_AssetType.NATIVE, _AssetType.ERC20, _AssetType.ERC721];
  const substrateSupportAssetTypes = [_AssetType.NATIVE, _AssetType.LOCAL, _AssetType.PSP22, _AssetType.PSP34, _AssetType.GRC20, _AssetType.GRC721];

  // recheck chain with two types.
  if (chainInfo.substrateInfo) {
    return substrateSupportAssetTypes.includes(chainAsset.assetType);
  }

  if (chainInfo.evmInfo) {
    return evmSupportAssetTypes.includes(chainAsset.assetType);
  }

  if (chainInfo.bitcoinInfo) {
    return bitcoinSupportAssetTypes.includes(chainAsset.assetType);
  }

  throw new Error(`${chainAsset.originChain} does not has a suitable chainInfo`);
}

export function validateChainDisableEvmTransfer (chainAsset: _ChainAsset) {
  const chainInfo = ChainInfoMap[chainAsset.originChain];

  if (!chainInfo) {
    throw new Error(`${chainAsset.originChain} is not existed`);
  }

  if (!chainInfo.evmInfo) {
    throw new Error(`${chainAsset.originChain} is not Evm chain`);
  }

  const isChainMatchCondition = chainInfo.evmInfo?.evmChainId === -1 && chainInfo.substrateInfo;

  if (isChainMatchCondition) {
    return chainAsset.metadata?.disableEvmTransfer;
  }

  return false;
}
