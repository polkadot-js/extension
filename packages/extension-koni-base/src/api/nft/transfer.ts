// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { BasicTxErrorType } from '@subwallet/extension-base/background/KoniTypes';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { reformatAddress } from '@subwallet/extension-base/utils';
import { SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME } from '@subwallet/extension-koni-base/api/nft/config';

import { ApiPromise } from '@polkadot/api';

export async function acalaTransferHandler (api: ApiPromise, senderAddress: string, recipientAddress: string, params: Record<string, any>): Promise<string> {
  const itemId = params.itemId as number;
  const collectionId = params.collectionId as number;
  const info = await api.tx.nft.transfer(recipientAddress, [collectionId, itemId]).paymentInfo(senderAddress);

  return info.partialFee.toNumber().toString();
}

export async function rmrkTransferHandler (api: ApiPromise, senderAddress: string, recipientAddress: string, params: Record<string, any>): Promise<[string, TransactionError[]]> {
  const remark = params.remark as string;

  if (!remark) {
    return ['0', [new TransactionError(BasicTxErrorType.INVALID_PARAMS, 'Remark is required')]];
  }

  const parsedRemark = remark.concat(recipientAddress.replace(
    /\\s/g,
    ''
  ));

  const info = await api.tx.system.remark(parsedRemark).paymentInfo(senderAddress);

  return [info.partialFee.toNumber().toString(), []];
}

export async function uniqueTransferHandler (api: ApiPromise, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  const itemId = params.itemId as number;
  const collectionId = params.collectionId as number;
  const info = await api.tx.nft.transfer({ Substrate: recipientAddress }, collectionId, itemId, 1).paymentInfo(senderAddress);

  return info.partialFee.toNumber().toString();
}

export async function quartzTransferHandler (api: ApiPromise, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  const itemId = params.itemId as number;
  const collectionId = params.collectionId as number;

  const info = await api.tx.unique.transfer({ Substrate: recipientAddress }, collectionId, itemId, 1).paymentInfo(senderAddress);

  return info.partialFee.toNumber().toString();
}

export async function statemineTransferHandler (api: ApiPromise, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  const itemId = params.itemId as number;
  const collectionId = params.collectionId as number;

  const info = await api.tx.uniques.transfer(collectionId, itemId, recipientAddress).paymentInfo(senderAddress);

  return info.partialFee.toNumber().toString();
}

export function isRecipientSelf (currentAddress: string, recipientAddress: string) {
  return reformatAddress(currentAddress, 1) === reformatAddress(recipientAddress, 1);
}

export function acalaGetExtrinsic (apiProp: _SubstrateApi, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  try {
    const itemId = params.itemId as number;
    const collectionId = params.collectionId as number;

    return apiProp.api.tx.nft.transfer(recipientAddress, [collectionId, itemId]);
  } catch (e) {
    console.error('error handling acala transfer nft', e);

    return null;
  }
}

export function rmrkGetExtrinsic (apiProp: _SubstrateApi, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  try {
    const remark = params.remark as string;

    if (!remark) {
      return null;
    }

    const parsedRemark = remark.concat(recipientAddress.replace(
      /\\s/g,
      ''
    ));

    return apiProp.api.tx.system.remark(parsedRemark);
  } catch (e) {
    console.error('error handling rmrk transfer nft', e);

    return null;
  }
}

export function uniqueGetExtrinsic (apiProp: _SubstrateApi, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  try {
    const itemId = params.itemId as number;
    const collectionId = params.collectionId as number;

    return apiProp.api.tx.nft.transfer({ Substrate: recipientAddress }, collectionId, itemId, 1);
  } catch (e) {
    console.error('error handling unique transfer nft', e);

    return null;
  }
}

export function quartzGetExtrinsic (apiProp: _SubstrateApi, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  try {
    const itemId = params.itemId as number;
    const collectionId = params.collectionId as number;

    return apiProp.api.tx.unique.transfer({ Substrate: recipientAddress }, collectionId, itemId, 1);
  } catch (e) {
    console.error('error handling quartz transfer nft', e);

    return null;
  }
}

export function statemineGetExtrinsic (apiProp: _SubstrateApi, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  try {
    const itemId = params.itemId as number;
    const collectionId = params.collectionId as number;

    return apiProp.api.tx.uniques.transfer(collectionId, itemId, recipientAddress);
  } catch (e) {
    console.error('error handling statemine transfer nft', e);

    return null;
  }
}

export function getNftTransferExtrinsic (networkKey: string, apiProp: _SubstrateApi, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  switch (networkKey) {
    case SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME.acala:
      return acalaGetExtrinsic(apiProp, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME.karura:
      return acalaGetExtrinsic(apiProp, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME.kusama:
      return rmrkGetExtrinsic(apiProp, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME.uniqueNft:
      return uniqueGetExtrinsic(apiProp, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME.quartz:
      return quartzGetExtrinsic(apiProp, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME.opal:
      return quartzGetExtrinsic(apiProp, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME.statemine:
      return statemineGetExtrinsic(apiProp, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME.statemint:
      return statemineGetExtrinsic(apiProp, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME.bitcountry:
      return acalaGetExtrinsic(apiProp, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME.pioneer:
      return acalaGetExtrinsic(apiProp, senderAddress, recipientAddress, params);
  }

  return null;
}
