// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

export type OmitProps<T, K> = Pick<T, Exclude<keyof T, K>>;

export type SubtractProps<T, K> = OmitProps<T, keyof K>;

export type BitLength = 8 | 16 | 32 | 64 | 128 | 256;

export interface TokenItemType {
  networkKey: string;
  token: string;
  decimals: number;
  isMainToken: boolean;
  specialOption?: object;
}

export interface SenderInputAddressType {
  address: string;
  networkKey: string;
  token: string;
}
