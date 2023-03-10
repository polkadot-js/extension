// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { encodeNumber } from '@polkadot/react-qr/util';
import { u8aConcat } from '@polkadot/util';

const MULTIPART = new Uint8Array([0]);
const STANDARD_FRAME_SIZE = 2 ** 9;

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
