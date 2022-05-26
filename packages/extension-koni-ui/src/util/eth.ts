// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import RLP from 'rlp';

import { u8aToHex } from '@polkadot/util';

export const rlpItem = (rlp: string, position: number) => {
  const decodeArr = RLP.decode(rlp);
  const u8a = decodeArr[position] as Uint8Array || [];

  return u8aToHex(u8a);
};

export const ethSign = (message: string) => message;
