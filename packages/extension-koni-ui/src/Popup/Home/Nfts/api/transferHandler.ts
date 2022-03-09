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

  console.log('fee', info.partialFee.toHuman());

  return {
    info,
    extrinsic
  } as TransferResponse;
}

export default async function transferHandler (api: ApiPromise, networkKey: string, senderAddress: string, recipientAddress: string, params: Record<string, any>): Promise<TransferResponse | null> {
  switch (networkKey) {
    case 'acala':
      return await acalaTransferHandler(api, senderAddress, recipientAddress, params);
  }

  return null;
}
