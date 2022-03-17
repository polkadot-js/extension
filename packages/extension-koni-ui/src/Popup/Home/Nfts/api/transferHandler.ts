// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiPromise } from '@polkadot/api';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import { RuntimeDispatchInfo } from '@polkadot/types/interfaces';

export interface TransferResponse {
  info?: RuntimeDispatchInfo;
  extrinsic?: SubmittableExtrinsic<'promise'>
}

async function acalaTransferHandler (api: ApiPromise, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  if (!params.collectionId || !params.itemId) return {};

  const itemId = params.itemId as number;
  const collectionId = params.collectionId as number;

  const [info, extrinsic] = await Promise.all([
    api.tx.nft.transfer(recipientAddress, [collectionId, itemId]).paymentInfo(senderAddress),
    api.tx.nft.transfer(recipientAddress, [collectionId, itemId])
  ]);

  return {
    info,
    extrinsic
  } as TransferResponse;
}

async function rmrkTransferHandler (api: ApiPromise, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  const remark = params.remark as string;

  if (!remark) return {};

  const parsedRemark = remark.concat(recipientAddress.replace(
    /\\s/g,
    ''
  ));

  const [info, extrinsic] = await Promise.all([
    api.tx.system.remark(parsedRemark).paymentInfo(senderAddress),
    api.tx.system.remark(parsedRemark)
  ]);

  return {
    info,
    extrinsic
  } as TransferResponse;
}

async function uniqueTransferHandler (api: ApiPromise, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  if (!params.collectionId || !params.itemId) return {};

  const itemId = params.itemId as number;
  const collectionId = params.collectionId as number;

  const [info, extrinsic] = await Promise.all([
    api.tx.nft.transfer({ Substrate: recipientAddress }, collectionId, itemId, 1).paymentInfo(senderAddress), // 1 is amount
    api.tx.nft.transfer({ Substrate: recipientAddress }, collectionId, itemId, 1)
  ]);

  return {
    info,
    extrinsic
  } as TransferResponse;
}

async function quartzTransferHandler (api: ApiPromise, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  if (!params.collectionId || !params.itemId) return {};

  const itemId = params.itemId as number;
  const collectionId = params.collectionId as number;

  const [info, extrinsic] = await Promise.all([
    api.tx.unique.transfer({ Substrate: recipientAddress }, collectionId, itemId, 1).paymentInfo(senderAddress),
    api.tx.unique.transfer({ Substrate: recipientAddress }, collectionId, itemId, 1)
  ]);

  return {
    info,
    extrinsic
  } as TransferResponse;
}

async function statemineTransferHandler (api: ApiPromise, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  if (!params.collectionId || !params.itemId) return {};

  const itemId = params.itemId as number;
  const collectionId = params.collectionId as number;

  const [info, extrinsic] = await Promise.all([
    api.tx.uniques.transfer(collectionId, itemId, recipientAddress).paymentInfo(senderAddress),
    api.tx.uniques.transfer(collectionId, itemId, recipientAddress)
  ]);

  return {
    info,
    extrinsic
  } as TransferResponse;
}

export default async function transferHandler (api: ApiPromise, networkKey: string, senderAddress: string, recipientAddress: string, params: Record<string, any>): Promise<TransferResponse | null> {
  switch (networkKey) {
    case 'acala':
      return await acalaTransferHandler(api, senderAddress, recipientAddress, params);
    case 'karura':
      return await acalaTransferHandler(api, senderAddress, recipientAddress, params);
    case 'kusama':
      return await rmrkTransferHandler(api, senderAddress, recipientAddress, params);
    case 'uniqueNft':
      return await uniqueTransferHandler(api, senderAddress, recipientAddress, params);
    case 'quartz':
      return await quartzTransferHandler(api, senderAddress, recipientAddress, params);
    case 'opal':
      return await quartzTransferHandler(api, senderAddress, recipientAddress, params);
    case 'statemine':
      return await statemineTransferHandler(api, senderAddress, recipientAddress, params);
    case 'statemint':
      return await statemineTransferHandler(api, senderAddress, recipientAddress, params);
  }

  return null;
}
