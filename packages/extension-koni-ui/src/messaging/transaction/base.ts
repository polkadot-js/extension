// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AmountData, RequestFreeBalance } from '@subwallet/extension-base/background/KoniTypes';

import { sendMessage } from '../base';

export async function getFreeBalance (request: RequestFreeBalance): Promise<AmountData> {
  return sendMessage('pri(freeBalance.get)', request);
}

export async function subscribeFreeBalance (request: RequestFreeBalance, callback: (balance: AmountDataWithId) => void): Promise<AmountDataWithId> {
  return sendMessage('pri(freeBalance.subscribe)', request, callback);
}
