// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { sendMessage } from '@subwallet/extension-web-ui/messaging/base';
import { KeyringAddress } from '@subwallet/ui-keyring/types';

export async function saveRecentAccount (accountId: string, chain?: string): Promise<KeyringAddress> {
  return sendMessage('pri(accounts.saveRecent)', { accountId, chain });
}

export async function editContactAddress (address: string, name: string): Promise<boolean> {
  return sendMessage('pri(accounts.editContact)', { address: address, meta: { name: name } });
}

export async function removeContactAddress (address: string): Promise<boolean> {
  return sendMessage('pri(accounts.deleteContact)', { address: address });
}
