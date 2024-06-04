// Copyright 2019-2022 @subwallet/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { isSupportWindow } from '@subwallet/extension-base/utils';

export function getLocalStorage<T> (key: string, defaultValue: T): T {
  const item =
    isSupportWindow ? window.localStorage.getItem(key) : false;

  if (item) {
    try {
      return JSON.parse(item) as T;
    } catch (e) {}
  }

  return defaultValue;
}

export function setLocalStorage<T> (key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
}
