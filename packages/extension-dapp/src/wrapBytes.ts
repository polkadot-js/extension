// Copyright 2019-2021 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { u8aConcat, u8aEq, u8aToU8a } from '@polkadot/util';

export const PREFIX = u8aToU8a('<Bytes>');
export const POSTFIX = u8aToU8a('</Bytes>');

const WRAP_LEN = PREFIX.length + POSTFIX.length;

function isWrapped (u8a: Uint8Array): boolean {
  return u8a.length >= WRAP_LEN &&
    u8aEq(u8a.subarray(0, PREFIX.length), PREFIX) &&
    u8aEq(u8a.slice(-POSTFIX.length), POSTFIX);
}

export function unwrapBytes (bytes: string | Uint8Array): Uint8Array {
  const u8a = u8aToU8a(bytes);

  return isWrapped(u8a)
    ? u8a.subarray(PREFIX.length, u8a.length - POSTFIX.length)
    : u8a;
}

export function wrapBytes (bytes: string | Uint8Array): Uint8Array {
  const u8a = u8aToU8a(bytes);

  return isWrapped(u8a)
    ? u8a
    : u8aConcat(PREFIX, u8a, POSTFIX);
}
