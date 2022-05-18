// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, SubstrateNftTransaction } from '@subwallet/extension-base/background/KoniTypes';

export async function acalaTransferHandler (apiProp: ApiProps, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  try {
    const itemId = params.itemId as number;
    const collectionId = params.collectionId as number;

    const [info, extrinsic] = await Promise.all([
      apiProp.api.tx.nft.transfer(recipientAddress, [collectionId, itemId]).paymentInfo(senderAddress),
      apiProp.api.tx.nft.transfer(recipientAddress, [collectionId, itemId])
    ]);

    return {
      error: false,
      estimatedFee: info.partialFee.toHuman(),
      extrinsic
    } as SubstrateNftTransaction;
  } catch (e) {
    console.error('error handling acala transfer nft', e);

    return {
      error: true
    };
  }
}

export async function rmrkTransferHandler (apiProp: ApiProps, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  try {
    const remark = params.remark as string;

    if (!remark) {
      return { error: true };
    }

    const parsedRemark = remark.concat(recipientAddress.replace(
      /\\s/g,
      ''
    ));

    const [info, extrinsic] = await Promise.all([
      apiProp.api.tx.system.remark(parsedRemark).paymentInfo(senderAddress),
      apiProp.api.tx.system.remark(parsedRemark)
    ]);

    return {
      error: false,
      estimatedFee: info.partialFee.toHuman(),
      extrinsic
    } as SubstrateNftTransaction;
  } catch (e) {
    console.error('error handling rmrk transfer nft', e);

    return {
      error: true
    };
  }
}

export async function uniqueTransferHandler (apiProp: ApiProps, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  try {
    const itemId = params.itemId as number;
    const collectionId = params.collectionId as number;

    const [info, extrinsic] = await Promise.all([
      apiProp.api.tx.nft.transfer({ Substrate: recipientAddress }, collectionId, itemId, 1).paymentInfo(senderAddress), // 1 is amount
      apiProp.api.tx.nft.transfer({ Substrate: recipientAddress }, collectionId, itemId, 1)
    ]);

    return {
      error: false,
      estimatedFee: info.partialFee.toHuman(),
      extrinsic
    } as SubstrateNftTransaction;
  } catch (e) {
    console.error('error handling unique transfer nft', e);

    return {
      error: true
    };
  }
}

export async function quartzTransferHandler (apiProp: ApiProps, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  try {
    const itemId = params.itemId as number;
    const collectionId = params.collectionId as number;

    const [info, extrinsic] = await Promise.all([
      apiProp.api.tx.unique.transfer({ Substrate: recipientAddress }, collectionId, itemId, 1).paymentInfo(senderAddress),
      apiProp.api.tx.unique.transfer({ Substrate: recipientAddress }, collectionId, itemId, 1)
    ]);

    return {
      error: false,
      estimatedFee: info.partialFee.toHuman(),
      extrinsic
    } as SubstrateNftTransaction;
  } catch (e) {
    console.error('error handling quartz transfer nft', e);

    return {
      error: true
    };
  }
}

export async function statemineTransferHandler (apiProp: ApiProps, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  try {
    const itemId = params.itemId as number;
    const collectionId = params.collectionId as number;

    const [info, extrinsic] = await Promise.all([
      apiProp.api.tx.uniques.transfer(collectionId, itemId, recipientAddress).paymentInfo(senderAddress),
      apiProp.api.tx.uniques.transfer(collectionId, itemId, recipientAddress)
    ]);

    return {
      error: false,
      estimatedFee: info.partialFee.toHuman(),
      extrinsic
    } as SubstrateNftTransaction;
  } catch (e) {
    console.error('error handling statemine transfer nft', e);

    return {
      error: true
    };
  }
}
