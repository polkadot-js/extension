// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { StorageDataInterface } from '@subwallet/extension-base/types';
import { sendMessage } from '@subwallet/extension-koni-ui/messaging';

export async function exportIndexedDB (): Promise<string> {
  return sendMessage('pri(database.export)', null);
}

export async function importIndexedDB (request: string): Promise<boolean> {
  return sendMessage('pri(database.import)', request);
}

export async function getIndexedDBJson (): Promise<object> {
  return sendMessage('pri(database.exportJson)', null);
}

export async function migrateLocalStorage (request: string): Promise<boolean> {
  return sendMessage('pri(database.migrateLocalStorage)', request);
}

export async function setValueLocalStorage (request: StorageDataInterface): Promise<boolean> {
  return sendMessage('pri(database.setLocalStorage)', request);
}
