// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CustomTokenType } from '@subwallet/extension-base/background/KoniTypes';
import { evmNftGetTransaction, substrateNftGetTransaction, wasmNftGetTransaction } from '@subwallet/extension-koni-ui/messaging';
import { _NftItem, SUPPORTED_TRANSFER_CHAIN_NAME, TransferResponse } from '@subwallet/extension-koni-ui/Popup/Home/Nfts/utils';

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

async function psp34TransferHandler (networkKey: string, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  try {
    const resp = await wasmNftGetTransaction({
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
    console.error('error handling wasm transfer nft', e);

    return null;
  }
}

export default async function transferHandler (networkKey: string, senderAddress: string, recipientAddress: string, params: Record<string, any>, nftItem: _NftItem): Promise<TransferResponse | null> {
  if (nftItem.type === CustomTokenType.erc721) {
    return await web3TransferHandler(networkKey, senderAddress, recipientAddress, params);
  } else if (nftItem.type === CustomTokenType.psp34) {
    return await psp34TransferHandler(networkKey, senderAddress, recipientAddress, params);
  } else {
    switch (networkKey) {
      case SUPPORTED_TRANSFER_CHAIN_NAME.acala:
        return await substrateTransferHandler(SUPPORTED_TRANSFER_CHAIN_NAME.acala, senderAddress, recipientAddress, params);
      case SUPPORTED_TRANSFER_CHAIN_NAME.karura:
        return await substrateTransferHandler(SUPPORTED_TRANSFER_CHAIN_NAME.karura, senderAddress, recipientAddress, params);
      case SUPPORTED_TRANSFER_CHAIN_NAME.kusama:
        return await substrateTransferHandler(SUPPORTED_TRANSFER_CHAIN_NAME.kusama, senderAddress, recipientAddress, params);
      case SUPPORTED_TRANSFER_CHAIN_NAME.unique_network:
        return await substrateTransferHandler(SUPPORTED_TRANSFER_CHAIN_NAME.unique_network, senderAddress, recipientAddress, params);
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
      case SUPPORTED_TRANSFER_CHAIN_NAME.pioneer:
        return await substrateTransferHandler(SUPPORTED_TRANSFER_CHAIN_NAME.pioneer, senderAddress, recipientAddress, params);
    }
  }

  return null;
}
