// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, SubstrateNftTransaction } from '@subwallet/extension-base/background/KoniTypes';
import { SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME } from '@subwallet/extension-koni-base/api/nft/config';
import { reformatAddress } from '@subwallet/extension-koni-base/utils/utils';

import { keyring } from '@polkadot/ui-keyring';

export async function acalaTransferHandler (apiProp: ApiProps, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  try {
    const itemId = params.itemId as number;
    const collectionId = params.collectionId as number;

    const info = await apiProp.api.tx.nft.transfer(recipientAddress, [collectionId, itemId]).paymentInfo(senderAddress);

    return {
      error: false,
      estimatedFee: info.partialFee.toHuman()
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

    const info = await apiProp.api.tx.system.remark(parsedRemark).paymentInfo(senderAddress);

    return {
      error: false,
      estimatedFee: info.partialFee.toHuman()
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

    const info = await apiProp.api.tx.nft.transfer({ Substrate: recipientAddress }, collectionId, itemId, 1).paymentInfo(senderAddress); // 1 is amount

    return {
      error: false,
      estimatedFee: info.partialFee.toHuman()
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

    const info = await apiProp.api.tx.unique.transfer({ Substrate: recipientAddress }, collectionId, itemId, 1).paymentInfo(senderAddress);

    return {
      error: false,
      estimatedFee: info.partialFee.toHuman()
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

    const info = await apiProp.api.tx.uniques.transfer(collectionId, itemId, recipientAddress).paymentInfo(senderAddress);

    return {
      error: false,
      estimatedFee: info.partialFee.toHuman()
    } as SubstrateNftTransaction;
  } catch (e) {
    console.error('error handling statemine transfer nft', e);

    return {
      error: true
    };
  }
}

export function isRecipientSelf (currentAddress: string, recipientAddress: string) {
  return reformatAddress(currentAddress, 1) === reformatAddress(recipientAddress, 1);
}

export function unlockAccount (signAddress: string, signPassword: string): string | null {
  let publicKey;

  try {
    publicKey = keyring.decodeAddress(signAddress);
  } catch (error) {
    console.error(error);

    return 'unable to decode address';
  }

  const pair = keyring.getPair(publicKey);

  try {
    pair.decodePkcs8(signPassword);
    // isUnlockCached && cacheUnlock(pair);
  } catch (error) {
    console.error(error);

    return (error as Error).message;
  }

  return null;
}

export function acalaGetExtrinsic (apiProp: ApiProps, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  try {
    const itemId = params.itemId as number;
    const collectionId = params.collectionId as number;

    return apiProp.api.tx.nft.transfer(recipientAddress, [collectionId, itemId]);
  } catch (e) {
    console.error('error handling acala transfer nft', e);

    return null;
  }
}

export function rmrkGetExtrinsic (apiProp: ApiProps, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
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

export function uniqueGetExtrinsic (apiProp: ApiProps, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  try {
    const itemId = params.itemId as number;
    const collectionId = params.collectionId as number;

    return apiProp.api.tx.nft.transfer({ Substrate: recipientAddress }, collectionId, itemId, 1);
  } catch (e) {
    console.error('error handling unique transfer nft', e);

    return null;
  }
}

export function quartzGetExtrinsic (apiProp: ApiProps, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  try {
    const itemId = params.itemId as number;
    const collectionId = params.collectionId as number;

    return apiProp.api.tx.unique.transfer({ Substrate: recipientAddress }, collectionId, itemId, 1);
  } catch (e) {
    console.error('error handling quartz transfer nft', e);

    return null;
  }
}

export function statemineGetExtrinsic (apiProp: ApiProps, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  try {
    const itemId = params.itemId as number;
    const collectionId = params.collectionId as number;

    return apiProp.api.tx.uniques.transfer(collectionId, itemId, recipientAddress);
  } catch (e) {
    console.error('error handling statemine transfer nft', e);

    return null;
  }
}

export function getNftTransferExtrinsic (networkKey: string, apiProp: ApiProps, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
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
  }

  return null;
}
