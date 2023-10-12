// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RequestUnlockDotCheckIsMinted, RequestUnlockDotSubscribeMintedData, UnlockDotMintedData } from '@subwallet/extension-base/types';

import { sendMessage } from '../../base';

export async function unlockDotCheckIsMinted (request: RequestUnlockDotCheckIsMinted): Promise<boolean> {
  return sendMessage('pri(campaign.unlockDot.isMinted)', request);
}

export async function unlockDotCheckSubscribe (request: RequestUnlockDotSubscribeMintedData, cb: (data: UnlockDotMintedData | undefined) => void): Promise<UnlockDotMintedData | undefined> {
  return sendMessage('pri(campaign.unlockDot.subscribe)', request, cb);
}
