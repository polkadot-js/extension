// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME } from '@subwallet/extension-base/koni/api/nft/config';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { reformatAddress } from '@subwallet/extension-base/utils';

export function isRecipientSelf (currentAddress: string, recipientAddress: string) {
  return reformatAddress(currentAddress, 1) === reformatAddress(recipientAddress, 1);
}

export function acalaGetExtrinsic (substrateApi: _SubstrateApi, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  try {
    const itemId = params.itemId as number;
    const collectionId = params.collectionId as number;

    return substrateApi.api.tx.nft.transfer(recipientAddress, [collectionId, itemId]);
  } catch (e) {
    console.error(e);

    return null;
  }
}

export function rmrkGetExtrinsic (substrateApi: _SubstrateApi, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  try {
    const remark = params.remark as string;

    if (!remark) {
      return null;
    }

    const parsedRemark = remark.concat(recipientAddress.replace(
      /\\s/g,
      ''
    ));

    return substrateApi.api.tx.system.remark(parsedRemark);
  } catch (e) {
    console.error(e);

    return null;
  }
}

export function uniqueGetExtrinsic (substrateApi: _SubstrateApi, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  try {
    const itemId = params.itemId as number;
    const collectionId = params.collectionId as number;

    return substrateApi.api.tx.unique.transfer({ Substrate: recipientAddress }, collectionId, itemId, 1);
  } catch (e) {
    console.error(e);

    return null;
  }
}

export function statemineGetExtrinsic (substrateApi: _SubstrateApi, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  try {
    const itemId = params.itemId as number;
    const collectionId = params.collectionId as number;

    return substrateApi.api.tx.uniques.transfer(collectionId, itemId, recipientAddress);
  } catch (e) {
    console.error(e);

    return null;
  }
}

export function statemintGetExtrinsic (substrateApi: _SubstrateApi, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  try {
    const itemId = params.itemId as number;
    const collectionId = params.collectionId as number;

    return substrateApi.api.tx.nfts.transfer(collectionId, itemId, recipientAddress);
  } catch (e) {
    console.error(e);

    return null;
  }
}

export function getNftTransferExtrinsic (networkKey: string, substrateApi: _SubstrateApi, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  switch (networkKey) {
    case SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME.acala:
      return acalaGetExtrinsic(substrateApi, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME.karura:
      return acalaGetExtrinsic(substrateApi, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME.kusama:
      return rmrkGetExtrinsic(substrateApi, senderAddress, recipientAddress, params);
    // temporary prevent send nfts on Unique network-based chains
    // case SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME.uniqueNft:
    //   return uniqueGetExtrinsic(substrateApi, senderAddress, recipientAddress, params);
    // case SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME.quartz:
    //   return uniqueGetExtrinsic(substrateApi, senderAddress, recipientAddress, params);
    // case SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME.opal:
    //   return uniqueGetExtrinsic(substrateApi, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME.statemine:
      return statemineGetExtrinsic(substrateApi, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME.statemint:
      return statemintGetExtrinsic(substrateApi, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME.bitcountry:
      return acalaGetExtrinsic(substrateApi, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME.pioneer:
      return acalaGetExtrinsic(substrateApi, senderAddress, recipientAddress, params);
  }

  return null;
}
