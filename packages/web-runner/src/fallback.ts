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
  },
  getURL: (input: string) => (input)
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

        const rs = await storage.getMap(keys);

        return Object.entries(rs).reduce((result, [key, value]) => {
          result[key] = value;

          if (typeof value === 'string') {
            try {
              result[key] = JSON.parse(value);
            } catch (e) {
              // void
            }
          }

          return result;
        }, {} as Record<string, unknown>);
      })().catch(console.error);
    },
    // @ts-ignore
    set: (input: object, callback?: () => void) => {
      (async () => {
        const map = Object.entries(input).reduce((map, [key, value]) => {
          map[key] = JSON.stringify(value);

          return map;
        }, {} as Record<string, string>);

        await storage.setMap(map);
        callback && callback();
      })().catch(console.error);
    },
    // @ts-ignore
    remove: (key: string, callback?: () => void) => {
      (async () => {
        await storage.removeItem(key);
        callback && callback();
      })().catch(console.error);
    }
  }
};
