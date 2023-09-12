// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RequestApproveConnectWalletSession, RequestApproveWalletConnectNotSupport, RequestConnectWalletConnect, RequestRejectConnectWalletSession, RequestRejectWalletConnectNotSupport } from '@subwallet/extension-base/background/KoniTypes';
import { sendMessage } from '@subwallet/extension-koni-ui/messaging';

export async function addConnection (request: RequestConnectWalletConnect): Promise<boolean> {
  return sendMessage('pri(walletConnect.connect)', request);
}

export async function approveWalletConnectSession (request: RequestApproveConnectWalletSession): Promise<boolean> {
  return sendMessage('pri(walletConnect.session.approve)', request);
}

export async function rejectWalletConnectSession (request: RequestRejectConnectWalletSession): Promise<boolean> {
  return sendMessage('pri(walletConnect.session.reject)', request);
}

export async function disconnectWalletConnectConnection (topic: string): Promise<boolean> {
  return sendMessage('pri(walletConnect.session.disconnect)', { topic });
}

export async function approveWalletConnectNotSupport (request: RequestApproveWalletConnectNotSupport): Promise<boolean> {
  return sendMessage('pri(walletConnect.notSupport.approve)', request);
}

export async function rejectWalletConnectNotSupport (request: RequestRejectWalletConnectNotSupport): Promise<boolean> {
  return sendMessage('pri(walletConnect.notSupport.reject)', request);
}
