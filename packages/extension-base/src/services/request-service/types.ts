// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountAuthType, AccountJson, RequestSign, Resolver, ResponseSigning } from '@subwallet/extension-base/background/types';
import { MetadataDef } from '@subwallet/extension-inject/types';

export interface SignRequest extends Resolver<ResponseSigning> {
  account: AccountJson;
  id: string;
  request: RequestSign;
  url: string;
}

export interface MetaRequest extends Resolver<boolean> {
  id: string;
  request: MetadataDef;
  url: string;
}

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

export type AuthUrls = Record<string, AuthUrlInfo>;
