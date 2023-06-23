// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SignClientTypes } from '@walletconnect/types';

export const PROJECT_ID = 'f71612bcfa754c812b1d09ae771da62d';
export const RELAY_URL = 'wss://relay.walletconnect.com';
export const DEFAULT_WALLET_CONNECT_OPTIONS: SignClientTypes.Options = {
  logger: 'debug',
  projectId: PROJECT_ID,
  relayUrl: RELAY_URL,
  metadata: {
    name: 'React Wallet',
    description: 'React Wallet for WalletConnect',
    url: 'https://walletconnect.com/',
    icons: ['https://avatars.githubusercontent.com/u/37784886']
  }
};

export const ALL_WALLET_CONNECT_EVENT: SignClientTypes.Event[] = ['session_proposal', 'session_update', 'session_extend', 'session_ping', 'session_delete', 'session_expire', 'session_request', 'session_request_sent', 'session_event', 'proposal_expire'];
