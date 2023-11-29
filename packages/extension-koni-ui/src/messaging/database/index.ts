// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { sendMessage } from '@subwallet/extension-koni-ui/messaging';

export async function exportIndexedDB (): Promise<string> {
  return sendMessage('pri(database.export)', null);
}

export async function importIndexedDB (request: string): Promise<boolean> {
  return sendMessage('pri(database.import)', request);
}

export async function checkIndexedMetadata (request: string): Promise<object> {
  return sendMessage('pri(database.checkMetadata)', request);
}
