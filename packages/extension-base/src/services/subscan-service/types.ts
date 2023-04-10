// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

export interface SubscanRequest<T> {
  id: number,
  retry: number, // retry < 1 not start, retry === 0 start, retry > 0 number of retry
  status: 'pending' | 'running',
  run: () => Promise<any>;
  resolve: (value: any) => T;
  reject: (error?: any) => void;
}

export interface SubscanResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export interface IMultiChainBalance {
  network: string,
  symbol: string,
  decimal: number,
  price: string,
  category: string,
  balance: string,
  locked: string,
  reserved: string,
  bonded: string,
  unbonding: string,
  democracy_lock: string,
  election_lock: string
}
