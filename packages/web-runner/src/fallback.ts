// Copyright 2019-2022 @subwallet/web-runner authors & contributors
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line header/header
if (!global.chrome) {
  // @ts-ignore
  global.chrome = {};
}

// @ts-ignore
if (!global.chrome.extension) {
  // @ts-ignore
  global.chrome.extension = {
    getURL: (input: string) => input
  };
}

export function getLocalStorageKeys (): string[] {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return getLocalStorageItem('__storage_keys__', []);
}

export function setLocalStorageKeys (key: string) {
  const currentKeys = getLocalStorageKeys();

  currentKeys.push(key);
  setLocalStorageItem('__storage_keys__', currentKeys);
}

function setLocalStorageItem (key: string, value: any) {
  // eslint-disable-next-line eqeqeq
  if (key != '__storage_keys__') {
    setLocalStorageKeys(key);
  }

  localStorage.setItem(key, JSON.stringify(value));
}

function removeLocalStorageItem (key: string) {
  localStorage.removeItem(key);
}

function getLocalStorageItem (key: string, defaultVal: any = undefined) {
  const value: string | null = localStorage.getItem(key);

  if (value) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return JSON.parse(value);
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return defaultVal;
    }
  } else {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return defaultVal;
  }
}

// @ts-ignore
global.chrome.runtime = {
  lastError: undefined
};

global.chrome.storage = {
  local: {
    // @ts-ignore
    get: (
      keys: string[] | undefined | null,
      callback: (val: object) => void
    ) => {
      keys = getLocalStorageKeys();
      const rs: Record<string, any> = {};

      keys.forEach((k) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        rs[k] = getLocalStorageItem(k);
      });

      callback(rs);
    },
    // @ts-ignore
    set: (input: object, callback?: () => void) => {
      Object.entries(input).forEach(([k, v]) => {
        setLocalStorageItem(k, v);
      });

      callback && callback();
    },
    // @ts-ignore
    remove: (key: string, value: any, callback?: () => void) => {
      removeLocalStorageItem(key);
      callback && callback();
    }
  }
};
