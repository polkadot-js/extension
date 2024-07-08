// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainAssetMap, MultiChainAssetMap } from '@subwallet/chain-list';
import { _AssetRef, _ChainAsset, _ChainInfo, _MultiChainAsset } from '@subwallet/chain-list/types';
import { _TRANSFER_CHAIN_GROUP } from '@subwallet/extension-base/services/chain-service/constants';

// Check priceId valid in group asset

export function validateAssetGroupPrice (multiChainAsset: _MultiChainAsset, chainAsset: _ChainAsset) {
  if (chainAsset.multiChainAsset !== multiChainAsset.slug) {
    throw new Error(`Asset ${chainAsset.slug} are not in ${multiChainAsset.slug} group asset`);
  }

  return multiChainAsset.priceId === chainAsset.priceId;
}

export function validateAssetsGroupPrice (chainAsset1: _ChainAsset, chainAsset2: _ChainAsset) {
  if (chainAsset1.multiChainAsset !== chainAsset2.multiChainAsset) {
    throw new Error(`Asset ${chainAsset1.slug} and asset ${chainAsset2.slug} are not in a group asset`);
  }

  return chainAsset1.priceId === chainAsset2.priceId;
}

// Check priceId valid in group asset

// Check multichainAsset valid

export function checkMultichainAssetValid (chainAsset: _ChainAsset) {
  if (!chainAsset.multiChainAsset) {
    return true;
  }

  return Object.keys(MultiChainAssetMap).includes(chainAsset.multiChainAsset);
}

// Check multichainAsset valid

// Check slug asset ref

export function checkSwapAssetRef (slug: string, assetRef: _AssetRef) {
  return slug === `${assetRef.srcAsset}___${assetRef.destAsset}`;
}

// Check slug asset ref

// Check duplicate smartcontract

export function validateNotDuplicateSmartcontract (chainAsset: _ChainAsset) {
  if (!['ERC20', 'ERC721', 'PSP22', 'PSP34', 'GRC20', 'GRC721'].includes(chainAsset.assetType)) {
    throw new Error(`${chainAsset.slug} is not smart contract asset`);
  }

  const slug = chainAsset.slug;

  const isDuplicate = Object.entries(ChainAssetMap).some(([key, tokenInfo]) => slug !== key && chainAsset?.metadata?.contractAddress === tokenInfo?.metadata?.contractAddress);

  return !isDuplicate;
}

// Check duplicate smartcontract

// ---------------------

// TRANSFER

export function validateNativeLocalTransferMetadata (chainAsset: _ChainAsset) {
  if (!chainAsset.metadata) { // recheck this
    throw new Error(`Asset ${chainAsset.slug} is lack of metadata`);
  }

  const moonbeamGroup = ['moonbeam, moonbase, moonriver'];
  const onChainInfoLocalGroup = [_TRANSFER_CHAIN_GROUP.centrifuge, ..._TRANSFER_CHAIN_GROUP.bitcountry, ..._TRANSFER_CHAIN_GROUP.acala, ..._TRANSFER_CHAIN_GROUP.kintsugi, 'pendulum', 'amplitude'];
  const onChainInfoNativeGroup = [_TRANSFER_CHAIN_GROUP.centrifuge, ..._TRANSFER_CHAIN_GROUP.acala, ..._TRANSFER_CHAIN_GROUP.kintsugi];
  const assetIdLocalGroup = [..._TRANSFER_CHAIN_GROUP.statemine, ..._TRANSFER_CHAIN_GROUP.genshiro, ...moonbeamGroup, 'hydradx'];
  const assetIdNativeGroup = [..._TRANSFER_CHAIN_GROUP.sora_substrate, 'hydradx'];

  const chain = chainAsset.originChain;
  const isLocal = chainAsset.assetType === 'LOCAL';
  const isNative = chainAsset.assetType === 'NATIVE';

  if (isLocal && onChainInfoLocalGroup.includes(chain)) {
    return !!chainAsset.metadata.onChainInfo;
  }

  if (isNative && onChainInfoNativeGroup.includes(chain)) {
    return !!chainAsset.metadata.onChainInfo;
  }

  if (isLocal && assetIdLocalGroup.includes(chain)) {
    return !!chainAsset.metadata.assetId;
  }

  if (isNative && assetIdNativeGroup.includes(chain)) {
    return !!chainAsset.metadata.assetId;
  }

  throw new Error(`${chainAsset.slug} is not local or native asset`);
}

// TRANSFER

// SWAP

export function validateSwapAlterAsset (assetRef: _AssetRef) {
  if (assetRef.path !== 'SWAP') {
    throw new Error(`${assetRef.srcAsset}___${assetRef.destAsset} is not SWAP`);
  }

  const srcAsset = assetRef.srcAsset;
  const alterAsset = assetRef.metadata?.alternativeAsset as string;

  if (!alterAsset) {
    throw new Error(`${assetRef.srcAsset}___${assetRef.destAsset} does not has alternativeAsset`);
  }

  if (!ChainAssetMap[srcAsset] || !ChainAssetMap[alterAsset]) {
    throw new Error(`${srcAsset} or ${alterAsset} do not exist`);
  }

  return ChainAssetMap[srcAsset].multiChainAsset === ChainAssetMap[alterAsset].multiChainAsset;
}

// SWAP

// XCM

export function validateXcmMetadata (assetRef: _AssetRef) {
  if (assetRef.path !== 'XCM') {
    throw new Error(`${assetRef.srcAsset}___${assetRef.destAsset} is not XCM`);
  }

  const srcAsset = assetRef.srcAsset;
  const destAsset = assetRef.destAsset;

  if (!ChainAssetMap[srcAsset] || !ChainAssetMap[destAsset]) {
    throw new Error(`${srcAsset} or ${destAsset} do not exist`);
  }

  return (ChainAssetMap[srcAsset].metadata?.multilocation && ChainAssetMap[destAsset].metadata?.multilocation) || false;
}

// XCM

// EARNING

// @ts-ignore
export function checkValidSupportStaking (chainInfo: _ChainInfo) {
  if (!chainInfo.substrateInfo) {
    throw new Error(`chain ${chainInfo.slug} is not substrate chain`);
  }

  if (!chainInfo.substrateInfo.supportStaking) {
    return true;
  }

  // todo: check has related pallet staking
}

// todo: check alternativeAsset

// EARNING
