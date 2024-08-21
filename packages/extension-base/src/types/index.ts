// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

export interface Message extends MessageEvent {
  data: {
    error?: string;
    id: string;
    origin: string;
    response?: string;
    subscription?: string;
    sender?: string;
  }
}

export * from './balance';
export * from './buy';
export * from './campaigns';
export * from './common';
export * from './fee';
export * from './metadata';
export * from './ordinal';
export * from './transaction';
export * from './yield';
