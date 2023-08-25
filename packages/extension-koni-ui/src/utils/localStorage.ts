// Copyright 2019-2022 @subwallet/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

export function getLocalStorage<T> (key: string, defaultValue: T): T {
  const item =
    typeof window !== 'undefined' ? window.localStorage.getItem(key) : false;

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
