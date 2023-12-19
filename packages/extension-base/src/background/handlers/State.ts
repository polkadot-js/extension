// Copyright 2019-2022 @polkadot/extension-bg authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AccountAuthType } from '../types';

export interface Resolver<T> {
  reject: (error: Error) => void;
  resolve: (result: T) => void;
}

export type AuthUrls = Record<string, AuthUrlInfo>;

export interface AuthUrlInfo {
  count: number;
  id: string;
  isAllowed: boolean;
  origin: string;
  url: string;
  accountAuthType?: AccountAuthType;
  isAllowedMap: Record<string, boolean>;
  currentEvmNetworkKey?: string;
}
