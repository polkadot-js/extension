// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

export const notDef = (x: any) => x === null || typeof x === 'undefined';
export const isDef = (x: any) => !notDef(x);
export const nonEmptyArr = (x: any) => Array.isArray(x) && x.length > 0;
export const isEmptyArray = (x: any) => !Array.isArray(x) || (Array.isArray(x) && x.length === 0);

export function toShort (text: string, preLength = 6, sufLength = 6): string {
  if (text.length > (preLength + sufLength + 1)) {
    return `${text.slice(0, preLength)}…${text.slice(-sufLength)}`;
  }

  return text;
}
