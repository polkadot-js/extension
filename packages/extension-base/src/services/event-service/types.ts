// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';

export interface EventRegistry {
  'keyring.ready': [boolean],
  'account.ready': [boolean]
  'account.add': [string] // address
  'account.update': [string] // address
  'account.remove': [string] // address
  'chain.ready': [boolean]
  'chain.add': [string, _ChainInfo] // chain slug
  'chain.update': [string, _ChainInfo] // chain slug
  'chain.remove': [string] // chain slug
  'asset.ready': [boolean]
  'asset.add': [string, _ChainAsset] // token slug
  'asset.update': [string, _ChainAsset] // token slug
  'asset.remove': [string] // token slug
}

export type EventType = keyof EventRegistry;

export interface EventItem<T extends EventType> {
  type: T;
  data: EventRegistry[T];
}

export interface EventEmitterRegistry extends EventRegistry {
  lazy: EventItem<EventType>[];
}
