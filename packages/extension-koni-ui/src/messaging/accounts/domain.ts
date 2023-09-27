// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ResolveAddressToDomainRequest } from '@subwallet/extension-base/background/KoniTypes';
import { sendMessage } from '@subwallet/extension-koni-ui/messaging';

export async function resolveAddressToDomain (request: ResolveAddressToDomainRequest) {
  return sendMessage('pri(accounts.resolveAddressToDomain)', request);
}
