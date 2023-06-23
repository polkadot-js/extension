// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ConfirmationRequestBase, Resolver } from '@subwallet/extension-base/background/types';
import { EngineTypes, SignClientTypes } from '@walletconnect/types';

export interface WalletConnectSessionRequest extends ConfirmationRequestBase {
  request: SignClientTypes.EventArguments['session_proposal'];
}

export type ResultApproveWalletConnectSession = EngineTypes.ApproveParams;
export type RequestWalletConnectSession = WalletConnectSessionRequest & Resolver<void>;
