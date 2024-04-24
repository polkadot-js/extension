// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { findChainInfoByChainId, findChainInfoByHalfGenesisHash } from '@subwallet/extension-base/services/chain-service/utils';
import { SignClientTypes } from '@walletconnect/types';
import { ProposalTypes } from '@walletconnect/types/dist/types/sign-client/proposal';

import { isEthereumAddress } from '@polkadot/util-crypto';

import { WALLET_CONNECT_EIP155_NAMESPACE, WALLET_CONNECT_POLKADOT_NAMESPACE, WALLET_CONNECT_REQUEST_KEY, WALLET_CONNECT_SUPPORT_NAMESPACES } from './constants';
import { EIP155_SIGNING_METHODS, WalletConnectNotSupportRequest, WalletConnectParamMap, WalletConnectSessionRequest, WalletConnectSigningMethod } from './types';

export const getWCId = (id: number): string => {
  return [WALLET_CONNECT_REQUEST_KEY, Date.now(), id].join('.');
};

export const convertConnectRequest = (request: SignClientTypes.EventArguments['session_proposal']): WalletConnectSessionRequest => {
  return {
    id: getWCId(request.id),
    isInternal: true,
    request: request,
    url: request.params.proposer.metadata.url
  };
};

export const convertNotSupportRequest = (request: SignClientTypes.EventArguments['session_request'], url: string): WalletConnectNotSupportRequest => {
  return {
    id: getWCId(request.id),
    isInternal: false,
    request: request,
    url: url
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

export const isWalletConnectRequest = (id?: string): boolean => {
  if (!id) {
    return false;
  }

  const [prefix] = id.split('.');

  return prefix === WALLET_CONNECT_REQUEST_KEY;
};

export const isProposalExpired = (params: ProposalTypes.Struct): boolean => {
  return params.expiryTimestamp * 1000 < Date.now();
};

export const isSupportWalletConnectNamespace = (namespace: string): boolean => {
  return WALLET_CONNECT_SUPPORT_NAMESPACES.includes(namespace);
};

export const isSupportWalletConnectChain = (chain: string, chainInfoMap: Record<string, _ChainInfo>): boolean => {
  const [namespace, info] = chain.split(':');

  if (namespace === WALLET_CONNECT_POLKADOT_NAMESPACE) {
    return !!findChainInfoByHalfGenesisHash(chainInfoMap, info);
  } else if (namespace === WALLET_CONNECT_EIP155_NAMESPACE) {
    return !!findChainInfoByChainId(chainInfoMap, parseInt(info));
  } else {
    return false;
  }
};
