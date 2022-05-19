// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { evmNftGetTransaction, substrateNftGetTransaction } from '@subwallet/extension-koni-ui/messaging';
import { SUPPORTED_TRANSFER_CHAIN_NAME, TransferResponse } from '@subwallet/extension-koni-ui/Popup/Home/Nfts/types';

async function substrateTransferHandler (networkKey: string, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  try {
    const resp = await substrateNftGetTransaction({
      networkKey,
      senderAddress,
      recipientAddress,
      params
    });

    if (resp.error) {
      return null;
    } else {
      return {
        estimatedFee: resp.estimatedFee
      } as TransferResponse;
    }
  } catch (e) {
    console.error('error handling substrate transfer nft', e);

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

export default async function transferHandler (networkKey: string, senderAddress: string, recipientAddress: string, params: Record<string, any>): Promise<TransferResponse | null> {
  switch (networkKey) {
    case SUPPORTED_TRANSFER_CHAIN_NAME.acala:
      return await substrateTransferHandler(SUPPORTED_TRANSFER_CHAIN_NAME.acala, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_CHAIN_NAME.karura:
      return await substrateTransferHandler(SUPPORTED_TRANSFER_CHAIN_NAME.acala, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_CHAIN_NAME.kusama:
      return await substrateTransferHandler(SUPPORTED_TRANSFER_CHAIN_NAME.acala, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_CHAIN_NAME.uniqueNft:
      return await substrateTransferHandler(SUPPORTED_TRANSFER_CHAIN_NAME.acala, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_CHAIN_NAME.quartz:
      return await substrateTransferHandler(SUPPORTED_TRANSFER_CHAIN_NAME.acala, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_CHAIN_NAME.opal:
      return await substrateTransferHandler(SUPPORTED_TRANSFER_CHAIN_NAME.acala, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_CHAIN_NAME.statemine:
      return await substrateTransferHandler(SUPPORTED_TRANSFER_CHAIN_NAME.acala, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_CHAIN_NAME.statemint:
      return await substrateTransferHandler(SUPPORTED_TRANSFER_CHAIN_NAME.acala, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_CHAIN_NAME.moonbase:
      return await web3TransferHandler(networkKey, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_CHAIN_NAME.moonbeam:
      return await web3TransferHandler(networkKey, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_CHAIN_NAME.moonriver:
      return await web3TransferHandler(networkKey, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_CHAIN_NAME.astarEvm:
      return await web3TransferHandler(networkKey, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_CHAIN_NAME.bitcountry:
      return await substrateTransferHandler(SUPPORTED_TRANSFER_CHAIN_NAME.acala, senderAddress, recipientAddress, params);
  }

  return null;
}
