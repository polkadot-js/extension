// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RequestUnlockDotCheckIsMinted, RequestUnlockDotSubscribeMintedData, UnlockDotTransactionNft } from '@subwallet/extension-base/types';

import { sendMessage } from '../../base';

export async function unlockDotCheckIsMinted (request: RequestUnlockDotCheckIsMinted): Promise<boolean> {
  return sendMessage('pri(campaign.unlockDot.isMinted)', request);
}

export async function unlockDotCheckSubscribe (request: RequestUnlockDotSubscribeMintedData, cb: (data: UnlockDotTransactionNft) => void): Promise<UnlockDotTransactionNft> {
  return sendMessage('pri(campaign.unlockDot.subscribe)', request, cb);
}
