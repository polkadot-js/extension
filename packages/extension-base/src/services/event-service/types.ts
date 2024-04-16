// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { CurrentAccountInfo } from '@subwallet/extension-base/background/KoniTypes';
import { SWTransaction } from '@subwallet/extension-base/services/transaction-service/types';

export interface EventRegistry {
  'general.sleep': [boolean];
  'general.wakeup': [boolean];
  'crypto.ready': [boolean];
  'database.ready': [boolean];

  /* Keyring */
  /** Password state ready  */
  'keyring.ready': [boolean];
  /** Update current account  */
  'account.updateCurrent': [CurrentAccountInfo];
  /** Account list loaded  */
  'account.ready': [boolean];
  /** Add a new account  */
  'account.add': [string]; // address
  /** Update account */
  'account.update': [string]; // address
  /** Remove a account  */
  'account.remove': [string]; // address
  /** Inject account done  */
  'inject.ready': [boolean];
  /* Keyring */

  'chain.ready': [boolean]; // chain is ready and migration done
  'chain.add': [string]; // chain slug
  'chain.updateState': [string]; // chain slug

  'asset.ready': [boolean]; // Init asset ready
  'asset.online.ready': [boolean]; // Update latest asset done
  'asset.updateState': [string]; // token slug

  'transaction.done': [SWTransaction];
  'transaction.failed': [SWTransaction | undefined];
  'transaction.timeout': [SWTransaction | undefined];
  'transaction.submitStaking': [string];
  'transaction.transferNft': [SWTransaction | undefined];
  'mantaPay.initSync': [string | undefined]; // zkAddress
  'mantaPay.submitTransaction': [SWTransaction | undefined];
  'mantaPay.enable': [string];

  'migration.done': [boolean];
  'campaign.ready': [boolean];

  // Buy token
  'buy.tokens.ready': [boolean];
  'buy.services.ready': [boolean];

  // Earning
  'earning.ready': [boolean];

  // Swap
  'swap.ready': [boolean];
}

export type EventType = keyof EventRegistry;

export const COMMON_RELOAD_EVENTS: EventType[] = [
  'account.updateCurrent',
  'account.add',
  'account.remove',
  'asset.updateState',
  'chain.updateState',
  'chain.add',
  'mantaPay.initSync', // TODO: re-check this
  'mantaPay.enable'
];

export interface EventItem<T extends EventType> {
  type: T;
  data: EventRegistry[T];
}

export interface EventEmitterRegistry extends EventRegistry {
  lazy: EventItem<EventType>[];
}
