// Copyright 2019-2021 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { u8aConcat, u8aEq, u8aToU8a } from '@polkadot/util';

export const PREFIX = u8aToU8a('<RawBytes>');
export const POSTFIX = u8aToU8a('</RawBytes>');

const WRAP_LEN = PREFIX.length + POSTFIX.length;

export function wrapRawBytes (bytes: string | Uint8Array): Uint8Array {
  const u8a = u8aToU8a(bytes);
  const hasWrapper = u8a.length <= WRAP_LEN &&
    u8aEq(u8a.subarray(0, PREFIX.length), PREFIX) &&
    u8aEq(u8a.slice(-POSTFIX.length), POSTFIX);

  return hasWrapper
    ? u8a
    : u8aConcat(PREFIX, u8a, POSTFIX);
}
