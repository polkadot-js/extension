// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SwapQuote, SwapRequest } from '@subwallet/extension-base/types/swap';
import { sendMessage } from '@subwallet/extension-web-ui/messaging';

export async function handleSwapRequest (request: SwapRequest) {
  return sendMessage('pri(swapService.handleSwapRequest)', request);
}

export async function getLatestSwapQuote (request: SwapRequest) {
  return sendMessage('pri(swapService.getLatestQuote)', request);
}
