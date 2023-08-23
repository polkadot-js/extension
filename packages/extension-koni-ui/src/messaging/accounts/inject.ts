// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { InjectedAccountWithMeta } from '@subwallet/extension-inject/types';
import { sendMessage } from '@subwallet/extension-koni-ui/messaging/base';

export async function loadInjects (accounts: InjectedAccountWithMeta[]): Promise<boolean> {
  return sendMessage('pri(accounts.inject.load)', { accounts });
}
