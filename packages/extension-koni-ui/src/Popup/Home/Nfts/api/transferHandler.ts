// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { evmNftGetTransaction } from '@subwallet/extension-koni-ui/messaging';
import { SUPPORTED_TRANSFER_CHAIN_NAME, TransferResponse } from '@subwallet/extension-koni-ui/Popup/Home/Nfts/types';

import { ApiPromise } from '@polkadot/api';

async function acalaTransferHandler (api: ApiPromise, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  try {
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
  } catch (e) {
    console.log('error handling acala transfer nft', e);

    return null;
  }
}

async function rmrkTransferHandler (api: ApiPromise, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  try {
    const remark = params.remark as string;

    if (!remark) {
      return {};
    }

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
  } catch (e) {
    console.log('error handling rmrk transfer nft', e);

    return null;
  }
}

async function uniqueTransferHandler (api: ApiPromise, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  try {
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
  } catch (e) {
    console.log('error handling unique transfer nft', e);

    return null;
  }
}

async function quartzTransferHandler (api: ApiPromise, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  try {
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
  } catch (e) {
    console.log('error handling quartz transfer nft', e);

    return null;
  }
}

async function statemineTransferHandler (api: ApiPromise, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  try {
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
  } catch (e) {
    console.log('error handling statemine transfer nft', e);

    return null;
  }
}

async function web3TransferHandler (networkKey: string, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  const { estimatedFee, tx } = await evmNftGetTransaction({
    networkKey,
    senderAddress,
    recipientAddress,
    params
  });

  if (estimatedFee === null || tx === null) {
    return null;
  }

  return {
    web3RawTx: tx,
    estimatedGas: estimatedFee
  } as TransferResponse;
}

export default async function transferHandler (api: ApiPromise, networkKey: string, senderAddress: string, recipientAddress: string, params: Record<string, any>): Promise<TransferResponse | null> {
  switch (networkKey) {
    case SUPPORTED_TRANSFER_CHAIN_NAME.acala:
      return await acalaTransferHandler(api, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_CHAIN_NAME.karura:
      return await acalaTransferHandler(api, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_CHAIN_NAME.kusama:
      return await rmrkTransferHandler(api, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_CHAIN_NAME.uniqueNft:
      return await uniqueTransferHandler(api, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_CHAIN_NAME.quartz:
      return await quartzTransferHandler(api, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_CHAIN_NAME.opal:
      return await quartzTransferHandler(api, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_CHAIN_NAME.statemine:
      return await statemineTransferHandler(api, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_CHAIN_NAME.statemint:
      return await statemineTransferHandler(api, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_CHAIN_NAME.moonbase:
      return await web3TransferHandler(networkKey, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_CHAIN_NAME.moonbeam:
      return await web3TransferHandler(networkKey, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_CHAIN_NAME.moonriver:
      return await web3TransferHandler(networkKey, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_CHAIN_NAME.astarEvm:
      return await web3TransferHandler(networkKey, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_CHAIN_NAME.bitcountry:
      return await acalaTransferHandler(api, senderAddress, recipientAddress, params);
  }

  return null;
}
