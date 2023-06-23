// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { WalletConnectSessionRequest } from '@subwallet/extension-base/services/wallet-connect-service/types';
import { SignClientTypes } from '@walletconnect/types';

export const getWCId = (id: number): string => {
  return `wallet-connect.${Date.now()}.${id}`;
};

export const convertConnectRequest = (request: SignClientTypes.EventArguments['session_proposal']): WalletConnectSessionRequest => {
  return {
    id: getWCId(request.id),
    isInternal: false,
    request: request,
    url: request.params.proposer.metadata.url
  };
};
