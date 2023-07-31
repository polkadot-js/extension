// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { EvmSendTransactionParams } from '@subwallet/extension-base/background/KoniTypes';
import { ConfirmationRequestBase, Resolver } from '@subwallet/extension-base/background/types';
import { EngineTypes, SignClientTypes } from '@walletconnect/types';

import { SignerPayloadJSON } from '@polkadot/types/types';

export interface WalletConnectSessionRequest extends ConfirmationRequestBase {
  request: SignClientTypes.EventArguments['session_proposal'];
}

export interface WalletConnectNotSupportRequest extends ConfirmationRequestBase {
  request: SignClientTypes.EventArguments['session_request'];
}

export type ResultApproveWalletConnectSession = EngineTypes.ApproveParams;
export interface RequestWalletConnectSession extends WalletConnectSessionRequest, Resolver<void> {}
export interface RequestWalletConnectNotSupport extends WalletConnectNotSupportRequest, Resolver<void> {}

export enum EIP155_SIGNING_METHODS {
  PERSONAL_SIGN = 'personal_sign',
  ETH_SIGN = 'eth_sign',
  ETH_SIGN_TRANSACTION = 'eth_signTransaction',
  ETH_SIGN_TYPED_DATA = 'eth_signTypedData',
  ETH_SIGN_TYPED_DATA_V1 = 'eth_signTypedData_v1',
  ETH_SIGN_TYPED_DATA_V3 = 'eth_signTypedData_v3',
  ETH_SIGN_TYPED_DATA_V4 = 'eth_signTypedData_v4',
  ETH_SEND_RAW_TRANSACTION = 'eth_sendRawTransaction',
  ETH_SEND_TRANSACTION = 'eth_sendTransaction'
}

export enum POLKADOT_SIGNING_METHODS {
  POLKADOT_SIGN_TRANSACTION = 'polkadot_signTransaction',
  POLKADOT_SIGN_MESSAGE = 'polkadot_signMessage'
}

export type WalletConnectSigningMethod = EIP155_SIGNING_METHODS | POLKADOT_SIGNING_METHODS;

export interface WalletConnectPolkadotSignMessageParams {
  address: string;
  message: string;
}

export interface WalletConnectPolkadotSignTransactionParams {
  address: string;
  transactionPayload: SignerPayloadJSON;
}

export type WalletConnectEip155SignMessage = [string, string] // payload and address
export type WalletConnectEip155SendTransaction = [EvmSendTransactionParams];

export interface WalletConnectParamMap {
  [POLKADOT_SIGNING_METHODS.POLKADOT_SIGN_MESSAGE]: WalletConnectPolkadotSignMessageParams;
  [POLKADOT_SIGNING_METHODS.POLKADOT_SIGN_TRANSACTION]: WalletConnectPolkadotSignTransactionParams;
  [EIP155_SIGNING_METHODS.PERSONAL_SIGN]: WalletConnectEip155SignMessage;
  [EIP155_SIGNING_METHODS.ETH_SIGN]: WalletConnectEip155SignMessage;
  [EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA]: WalletConnectEip155SignMessage;
  [EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V3]: WalletConnectEip155SignMessage;
  [EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V4]: WalletConnectEip155SignMessage;
  [EIP155_SIGNING_METHODS.ETH_SEND_TRANSACTION]: WalletConnectEip155SendTransaction;
}
