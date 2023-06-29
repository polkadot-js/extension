// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SignClientTypes } from '@walletconnect/types';

import { isEthereumAddress } from '@polkadot/util-crypto';

import { WALLET_CONNECT_REQUEST_KEY } from './constants';
import { EIP155_SIGNING_METHODS, WalletConnectParamMap, WalletConnectSessionRequest, WalletConnectSigningMethod } from './types';

export const getWCId = (id: number): string => {
  return [WALLET_CONNECT_REQUEST_KEY, Date.now(), id].join('.');
};

export const convertConnectRequest = (request: SignClientTypes.EventArguments['session_proposal']): WalletConnectSessionRequest => {
  return {
    id: getWCId(request.id),
    isInternal: false,
    request: request,
    url: request.params.proposer.metadata.url
  };
};

export const parseRequestParams = <T extends WalletConnectSigningMethod> (params: unknown) => {
  // @ts-ignore
  return params as WalletConnectParamMap[T];
};

export const getEip155MessageAddress = (method: EIP155_SIGNING_METHODS, param: unknown): string => {
  switch (method) {
    case EIP155_SIGNING_METHODS.PERSONAL_SIGN:
    case EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA:
    case EIP155_SIGNING_METHODS.ETH_SIGN:
    case EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V3:
    case EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V4:
      // eslint-disable-next-line no-case-declarations
      const [p1, p2] = parseRequestParams<EIP155_SIGNING_METHODS.PERSONAL_SIGN>(param);

      if (typeof p1 === 'string' && isEthereumAddress(p1)) {
        return p1;
      } else if (typeof p2 === 'string' && isEthereumAddress(p2)) {
        return p2;
      }

      return '';
    default:
      return '';
  }
};

export const isWalletConnectRequest = (id: string) => {
  const [prefix] = id.split('.');

  return prefix === WALLET_CONNECT_REQUEST_KEY;
};

export const isProposalExpired = (proposal: SignClientTypes.EventArguments['session_proposal']): boolean => {
  const timeNum = proposal.params.expiry;
  const expireTime = new Date(timeNum > 10 ** 12 ? timeNum : timeNum * 1000);
  const now = new Date();

  return now.getTime() >= expireTime.getTime();
};
