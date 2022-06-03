// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NetworkJson } from '@subwallet/extension-base/background/KoniTypes';
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
        estimatedFee: resp.estimatedFee,
        balanceError: resp.balanceError
      } as TransferResponse;
    }
  } catch (e) {
    console.error('error handling substrate transfer nft', e);

    return null;
  }
}

async function web3TransferHandler (networkKey: string, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  const { balanceError, estimatedFee, tx } = await evmNftGetTransaction({
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
    estimatedGas: estimatedFee,
    balanceError
  } as TransferResponse;
}

export default async function transferHandler (networkKey: string, senderAddress: string, recipientAddress: string, params: Record<string, any>, networkJson: NetworkJson): Promise<TransferResponse | null> {
  if (networkJson.isEthereum && networkJson.isEthereum) {
    return await web3TransferHandler(networkKey, senderAddress, recipientAddress, params);
  } else {
    switch (networkKey) {
      case SUPPORTED_TRANSFER_CHAIN_NAME.acala:
        return await substrateTransferHandler(SUPPORTED_TRANSFER_CHAIN_NAME.acala, senderAddress, recipientAddress, params);
      case SUPPORTED_TRANSFER_CHAIN_NAME.karura:
        return await substrateTransferHandler(SUPPORTED_TRANSFER_CHAIN_NAME.karura, senderAddress, recipientAddress, params);
      case SUPPORTED_TRANSFER_CHAIN_NAME.kusama:
        return await substrateTransferHandler(SUPPORTED_TRANSFER_CHAIN_NAME.kusama, senderAddress, recipientAddress, params);
      case SUPPORTED_TRANSFER_CHAIN_NAME.uniqueNft:
        return await substrateTransferHandler(SUPPORTED_TRANSFER_CHAIN_NAME.uniqueNft, senderAddress, recipientAddress, params);
      case SUPPORTED_TRANSFER_CHAIN_NAME.quartz:
        return await substrateTransferHandler(SUPPORTED_TRANSFER_CHAIN_NAME.quartz, senderAddress, recipientAddress, params);
      case SUPPORTED_TRANSFER_CHAIN_NAME.opal:
        return await substrateTransferHandler(SUPPORTED_TRANSFER_CHAIN_NAME.opal, senderAddress, recipientAddress, params);
      case SUPPORTED_TRANSFER_CHAIN_NAME.statemine:
        return await substrateTransferHandler(SUPPORTED_TRANSFER_CHAIN_NAME.statemine, senderAddress, recipientAddress, params);
      case SUPPORTED_TRANSFER_CHAIN_NAME.statemint:
        return await substrateTransferHandler(SUPPORTED_TRANSFER_CHAIN_NAME.statemint, senderAddress, recipientAddress, params);
      case SUPPORTED_TRANSFER_CHAIN_NAME.bitcountry:
        return await substrateTransferHandler(SUPPORTED_TRANSFER_CHAIN_NAME.bitcountry, senderAddress, recipientAddress, params);
    }
  }

  return null;
}
