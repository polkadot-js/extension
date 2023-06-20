// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { CurrentAccountInfo } from '@subwallet/extension-base/background/KoniTypes';
import { SWTransaction } from '@subwallet/extension-base/services/transaction-service/types';

export interface EventRegistry {
  'keyring.ready': [boolean],
  'account.updateCurrent': [CurrentAccountInfo],
  'account.ready': [boolean],
  'account.add': [string], // address
  'account.update': [string], // address
  'account.remove': [string], // address

  'chain.ready': [boolean], // chain is ready and migration done
  'chain.add': [string], // chain slug
  'chain.updateState': [string], // chain slug

  'asset.ready': [boolean],
  'asset.updateState': [string], // token slug

  'transaction.done': [SWTransaction],
  'transaction.failed': [SWTransaction | undefined],
  'transaction.submitStaking': [string],
  'transaction.transferNft': [SWTransaction | undefined],
  'mantaPay.enable': [string] // zkAddress
}

export type EventType = keyof EventRegistry;

export const COMMON_RELOAD_EVENTS: EventType[] = [
  'account.updateCurrent',
  'asset.updateState',
  'account.add',
  'chain.updateState',
  'account.remove',
  'chain.add',
  'mantaPay.enable' // TODO: re-check this
];

export interface EventItem<T extends EventType> {
  type: T;
  data: EventRegistry[T];
}

export interface EventEmitterRegistry extends EventRegistry {
  lazy: EventItem<EventType>[];
}
