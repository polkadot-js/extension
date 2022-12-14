// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint @typescript-eslint/no-empty-interface: "off" */

import { _ChainInfo } from '@subwallet/extension-koni-base/services/chain-list/types';

export interface _DataMap {
  chainInfoMap: Record<string, _ChainInfo>,
  chainStateMap: Record<string, _ChainState>
}

export enum ConnectionStatus {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  UNSTABLE = 'UNSTABLE'
}

export interface _ChainState {
  slug: string,
  active: boolean,
  currentProvider: string,
  connectionStatus: ConnectionStatus
}

export const CUSTOM_NETWORK_PREFIX = 'custom-';
