// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { CurrentAccountInfo } from '@subwallet/extension-base/background/KoniTypes';
import { SWTransaction } from '@subwallet/extension-base/services/transaction-service/types';

export interface EventRegistry {
  'keyring.ready': [boolean],
  'account.updateCurrent': [CurrentAccountInfo]
  'account.ready': [boolean]
  'account.add': [string] // address
  'account.update': [string] // address
  'account.remove': [string] // address
  'chain.ready': [boolean] // chain is ready and migration done
  'chain.add': [string] // chain slug
  'chain.update': [string] // chain slug
  'chain.disable': [string] // chain slug
  'chain.enable': [string] // chain slug
  'chain.remove': [string] // chain slug
  'asset.ready': [boolean]
  'asset.add': [string] // token slug
  'asset.update': [string] // token slug
  'asset.enable': [string] // token slug
  'asset.disable': [string] // token slug
  'asset.remove': [string] // token slug,
  'transaction.done': [SWTransaction]
  'transaction.failed': [SWTransaction | undefined]
}

export type EventType = keyof EventRegistry;

export interface EventItem<T extends EventType> {
  type: T;
  data: EventRegistry[T];
}

export interface EventEmitterRegistry extends EventRegistry {
  lazy: EventItem<EventType>[];
}
