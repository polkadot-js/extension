// Copyright 2019-2022 @subwallet/web-runner authors & contributors
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line header/header
import { SWStorage } from '@subwallet/extension-base/storage';

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

const storage = SWStorage.instance;

function setLocalStorageItem (key: string, value: any) {
  storage.setItem(key, JSON.stringify(value));
}

function removeLocalStorageItem (key: string) {
  storage.removeItem(key);
}

function getLocalStorageItem (key: string, defaultVal: any = undefined) {
  const value: string | null = storage.getItem(key);

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

global.chrome.windows = {
  // @ts-ignore
  getCurrent: () => {
    // void
  }
};

global.chrome.tabs = {
  // @ts-ignore
  query: () => {
    // void
  }
};

global.chrome.storage = {
  local: {
    // @ts-ignore
    get: (
      keys: string[] | string | undefined | null,
      callback: (val: object) => void
    ) => {
      storage.waitReady.then(() => {
        if (!keys) {
          keys = storage.keys();
        }

        if (typeof keys === 'string') {
          keys = [keys];
        }

        const rs: Record<string, any> = {};

        keys.forEach((k) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          rs[k] = getLocalStorageItem(k);
        });

        callback(rs);
      }).catch(console.error);
    },
    // @ts-ignore
    set: (input: object, callback?: () => void) => {
      storage.waitReady.then(() => {
        Object.entries(input).forEach(([k, v]) => {
          setLocalStorageItem(k, v);
        });

        callback && callback();
      }).catch(console.error);
    },
    // @ts-ignore
    remove: (key: string, value: any, callback?: () => void) => {
      storage.waitReady.then(() => {
        removeLocalStorageItem(key);
        callback && callback();
      }).catch(console.error);
    }
  }
};
