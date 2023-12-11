// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

export const uniqueStringArray = (array: string[]): string[] => {
  const map: Record<string, string> = {};

  array.forEach((v) => {
    map[v] = v;
  });

  return Object.keys(map);
};

export function listMerge<T extends Record<string, any>> (keys: string[] | string, existed: T[], newItems: T[]): T[] {
  const getKey = (ks: string[] | string, item: Record<string, any>): string => {
    if (typeof ks === 'string') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-return
      return item[ks].toString();
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-return
    return ks.map((k) => (item[k].toString())).join('_');
  };

  // Build existed map with keys
  const existedMap: Record<string, T> = Object.fromEntries(existed.map((v) => {
    return [getKey(keys, v), v];
  }));

  newItems.forEach((item) => {
    const key = getKey(keys, item);

    if (existedMap[key]) {
      Object.assign(existedMap[key], item);
    } else {
      existed.push(item);
    }
  });

  return existed;
}
