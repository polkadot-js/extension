// Copyright 2019-2022 @polkadot/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { MULTIPART, STANDARD_FRAME_SIZE } from '@subwallet/extension-web-ui/constants';

import { isString, u8aConcat } from '@polkadot/util';

export const encodeNumber = (value: number): Uint8Array => {
  return new Uint8Array([value >> 8, value & 0xff]);
};

export const createImgSize = (size?: string | number): Record<string, string> => {
  if (!size) {
    return {
      height: 'auto',
      width: '100%'
    };
  }

  const _size = isString(size)
    ? size
    : `${size}px`;

  return {
    height: _size,
    width: _size
  };
};

export const createFrames = (input: Uint8Array): Uint8Array[] => {
  const frames = [];
  let idx = 0;
  const frameSize = Math.ceil(input.length / Math.ceil(input.length / STANDARD_FRAME_SIZE));

  while (idx < input.length) {
    frames.push(input.subarray(idx, idx + frameSize));
    idx += frameSize;
  }

  return frames.map((frame, index) => u8aConcat(MULTIPART, encodeNumber(frames.length), encodeNumber(index), frame));
};
