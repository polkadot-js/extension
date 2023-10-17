// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NftCollection, NftJson, NftTransactionRequest, RequestSubscribeNft } from '@subwallet/extension-base/background/KoniTypes';
import { SWTransactionResponse } from '@subwallet/extension-base/services/transaction-service/types';

import { sendMessage } from '../base';

export async function getNft (account: string): Promise<NftJson> {
  // @ts-ignore
  return sendMessage('pri(nft.getNft)', account);
}

export async function subscribeNft (request: RequestSubscribeNft, callback: (nftData: NftJson) => void): Promise<NftJson> {
  return sendMessage('pri(nft.getSubscription)', request, callback);
}

export async function subscribeNftCollection (callback: (data: NftCollection[]) => void): Promise<NftCollection[]> {
  return sendMessage('pri(nftCollection.getSubscription)', null, callback);
}

export async function evmNftSubmitTransaction (request: NftTransactionRequest): Promise<SWTransactionResponse> {
  return sendMessage('pri(evmNft.submitTransaction)', request);
}

export async function substrateNftSubmitTransaction (request: NftTransactionRequest): Promise<SWTransactionResponse> {
  return sendMessage('pri(substrateNft.submitTransaction)', request);
}
