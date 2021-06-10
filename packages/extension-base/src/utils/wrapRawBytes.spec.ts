// Copyright 2019-2021 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { u8aConcat, u8aEq, u8aToString } from '@polkadot/util';

import { POSTFIX, PREFIX } from './wrapRawBytes';
import { wrapRawBytes } from '.';

const TEST_DATA = 'this is just some random message that we expect to be wrapped along the way';
const TEST_WRAP = `${u8aToString(PREFIX)}${TEST_DATA}${u8aToString(POSTFIX)}`;

describe('wrapRawBytes', (): void => {
  it('wraps empty bytes', (): void => {
    expect(
      u8aEq(
        wrapRawBytes(new Uint8Array()),
        u8aConcat(PREFIX, POSTFIX)
      )
    ).toBe(true);
  });

  it('wraps when no wrapping is detected', (): void => {
    expect(
      u8aToString(
        wrapRawBytes(TEST_DATA)
      )
    ).toEqual(TEST_WRAP);
  });

  it('wraps when only start wrap is detected', (): void => {
    const START_WRAP = `${u8aToString(PREFIX)}${TEST_DATA}`;

    expect(
      u8aToString(
        wrapRawBytes(START_WRAP)
      )
    ).toEqual(`${u8aToString(PREFIX)}${START_WRAP}${u8aToString(POSTFIX)}`);
  });

  it('wraps when only end wrap is detected', (): void => {
    const END_WRAP = `${TEST_DATA}${u8aToString(POSTFIX)}`;

    expect(
      u8aToString(
        wrapRawBytes(END_WRAP)
      )
    ).toEqual(`${u8aToString(PREFIX)}${END_WRAP}${u8aToString(POSTFIX)}`);
  });

  it('does not re-wrap when a wrap is already present', (): void => {
    expect(
      u8aToString(
        wrapRawBytes(TEST_WRAP)
      )
    ).toEqual(TEST_WRAP);
  });

  it('does not re-wrap when a wrap (empty data) is already present', (): void => {
    const EMPTY_WRAP = `${u8aToString(PREFIX)}${u8aToString(POSTFIX)}`;

    expect(
      u8aToString(
        wrapRawBytes(EMPTY_WRAP)
      )
    ).toEqual(EMPTY_WRAP);
  });
});
