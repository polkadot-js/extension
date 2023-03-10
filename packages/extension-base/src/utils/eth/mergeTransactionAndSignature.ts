// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Web3Transaction } from '@subwallet/extension-base/signers/types';
import RLP, { Input } from 'rlp';

import { u8aToHex } from '@polkadot/util';

export const parseTxAndSignature = (tx: Web3Transaction, _signature: `0x${string}`): `0x${string}` => {
  const signature = _signature.slice(2);
  const r = `0x${signature.substring(0, 64)}`;
  const s = `0x${signature.substring(64, 128)}`;
  const v = `0x${signature.substring(128)}`;
  const data: Input = [
    tx.nonce,
    tx.gasPrice,
    tx.gasLimit,
    tx.to,
    tx.value,
    tx.data,
    v,
    r,
    s
  ];
  const encoded = RLP.encode(data);

  return u8aToHex(encoded);
};
