// Copyright 2019-2022 @subwallet/web-runner authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SWStorage } from '@subwallet/extension-base/storage';

const storage = SWStorage.instance;

// eslint-disable-next-line header/header
if (!global.chrome) {
  // @ts-ignore
  global.chrome = {};
}

// @ts-ignore
if (!global.chrome.extension) {
  // @ts-ignore
  global.chrome.extension = {
    getURL: (input: string) => `${input}`
  };
}

// @ts-ignore
global.chrome.runtime = {
  lastError: undefined,
  getURL: (input: string) => `/${input}`
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
      (async () => {
        if (!keys) {
          keys = await storage.keys();
        }

        if (typeof keys === 'string') {
          keys = [keys];
        }

        const rs: Record<string, any> = {};

        await Promise.all(keys.map(async (k) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const itemData = await storage.getItem(k);

          if (itemData === null) {
            rs[k] = undefined;
          } else {
            try {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-assignment
              rs[k] = JSON.parse(itemData);
            } catch (e) {
              rs[k] = itemData;
            }
          }
        }));

        return rs;
      })().then((callback)).catch(console.error);
    },
    // @ts-ignore
    set: (input: object, callback?: () => void) => {
      Promise.all(Object.entries(input).map(async ([k, v]) => {
        await storage.setItem(k, JSON.stringify(v));
      })).then(() => {
        callback && callback();
      }).catch(console.error);
    },
    // @ts-ignore
    remove: (key: string, value: any, callback?: () => void) => {
      storage.removeItem(key).then(() => {
        callback && callback();
      }).catch(console.error);
    }
  }
};
