// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { InjectedAccountWithMeta } from '@subwallet/extension-inject/types';
import { sendMessage } from '@subwallet/extension-web-ui/messaging/base';

export async function addInjects (accounts: InjectedAccountWithMeta[]): Promise<boolean> {
  return sendMessage('pri(accounts.inject.add)', { accounts });
}

export async function removeInjects (addresses: string[]): Promise<boolean> {
  return sendMessage('pri(accounts.inject.remove)', { addresses });
}
