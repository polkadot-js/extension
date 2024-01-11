// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { EIP155_SIGNING_METHODS, POLKADOT_SIGNING_METHODS, WalletConnectSigningMethod } from '@subwallet/extension-base/services/wallet-connect-service/types';
import { targetIsMobile } from '@subwallet/extension-base/utils';
import { SignClientTypes } from '@walletconnect/types';

export const PROJECT_ID_EXTENSION = '6da34c0b48164d27681924dd9a46d6be';
export const PROJECT_ID_MOBILE = '6da34c0b48164d27681924dd9a46d6be';
export const RELAY_URL = 'wss://relay.walletconnect.com';

export const DEFAULT_WALLET_CONNECT_OPTIONS: SignClientTypes.Options = {
  logger: 'error',
  projectId: targetIsMobile ? PROJECT_ID_MOBILE : PROJECT_ID_EXTENSION,
  relayUrl: RELAY_URL,
  metadata: {
    name: 'SubWallet',
    description: 'React Wallet for WalletConnect',
    url: 'https://www.subwallet.app/',
    icons: ['https://raw.githubusercontent.com/Koniverse/SubWallet-Extension/master/packages/extension-koni/public/images/icon-128.png']
  }
};

export const ALL_WALLET_CONNECT_EVENT: SignClientTypes.Event[] = ['session_proposal', 'session_update', 'session_extend', 'session_ping', 'session_delete', 'session_expire', 'session_request', 'session_request_sent', 'session_event', 'proposal_expire'];

export const WALLET_CONNECT_SUPPORTED_METHODS: WalletConnectSigningMethod[] = [
  POLKADOT_SIGNING_METHODS.POLKADOT_SIGN_MESSAGE,
  POLKADOT_SIGNING_METHODS.POLKADOT_SIGN_TRANSACTION,
  EIP155_SIGNING_METHODS.ETH_SEND_TRANSACTION,
  EIP155_SIGNING_METHODS.PERSONAL_SIGN,
  EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V1,
  EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V3,
  EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V4
];

export const WALLET_CONNECT_REQUEST_KEY = 'wallet-connect';

export const WALLET_CONNECT_EIP155_NAMESPACE = 'eip155';
export const WALLET_CONNECT_POLKADOT_NAMESPACE = 'polkadot';

export const WALLET_CONNECT_SUPPORT_NAMESPACES: string[] = [WALLET_CONNECT_EIP155_NAMESPACE, WALLET_CONNECT_POLKADOT_NAMESPACE];
