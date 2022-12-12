// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { KeyringPasswordJson } from '@subwallet/keyring/types';
import type { PasswordStore } from '@subwallet/ui-keyring/types';

import { SUBWALLET_KEYRING } from '@subwallet/ui-keyring/defaults';

type StoreValue = Record<string, unknown>;

const lastError = (type: string): void => {
  const error = chrome.runtime.lastError;

  if (error) {
    console.error(`KeyringStore.${type}:: runtime.lastError:`, error);
  }
};

export default class KeyringStore implements PasswordStore {
  public get (update: (value: KeyringPasswordJson) => void): void {
    chrome.storage.local.get([SUBWALLET_KEYRING], (result: StoreValue): void => {
      lastError('get');

      update(result[SUBWALLET_KEYRING] as KeyringPasswordJson);
    });
  }

  public remove (update?: () => void): void {
    chrome.storage.local.remove(SUBWALLET_KEYRING, (): void => {
      lastError('remove');

      update && update();
    });
  }

  public set (value: KeyringPasswordJson, update?: () => void): void {
    chrome.storage.local.set({ [SUBWALLET_KEYRING]: value }, (): void => {
      lastError('set');

      update && update();
    });
  }
}
