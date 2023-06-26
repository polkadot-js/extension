// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { formatJsonRpcError, formatJsonRpcResult } from '@json-rpc-tools/utils';
import KoniState from '@subwallet/extension-base/koni/background/handlers/State';
import WalletConnectService from '@subwallet/extension-base/services/wallet-connect-service';
import { getEip155MessageAddress, getWCId, parseRequestParams } from '@subwallet/extension-base/services/wallet-connect-service/helpers';
import { EIP155_SIGNING_METHODS } from '@subwallet/extension-base/services/wallet-connect-service/types';
import { isSameAddress } from '@subwallet/extension-base/utils';
import { SignClientTypes } from '@walletconnect/types';
import { getSdkError } from '@walletconnect/utils';

export default class Eip155RequestHandler {
  readonly #walletConnectService: WalletConnectService;
  readonly #koniState: KoniState;

  constructor (koniState: KoniState, walletConnectService: WalletConnectService) {
    this.#koniState = koniState;
    this.#walletConnectService = walletConnectService;
  }

  #checkAccount (address: string, accounts: string[]) {
    if (!accounts.find((account) => isSameAddress(account, address))) {
      throw new Error(getSdkError('UNSUPPORTED_ACCOUNTS').message + ' ' + address);
    }
  }

  #handleError (topic: string, id: number, e: unknown) {
    console.log(e);
    let message = (e as Error).message;

    if (message.includes('User Rejected Request')) {
      message = getSdkError('USER_REJECTED').message;
    }

    this.#walletConnectService.responseRequest({
      topic: topic,
      response: formatJsonRpcError(id, message)
    }).catch(console.error);
  }

  public handleRequest (requestEvent: SignClientTypes.EventArguments['session_request']) {
    const { id, params, topic } = requestEvent;
    const { chainId: _chainId, request } = params;
    const method = request.method as EIP155_SIGNING_METHODS;
    const requestSession = this.#walletConnectService.getSession(topic);

    const url = requestSession.peer.metadata.url;
    const sessionAccounts = requestSession.namespaces.eip155.accounts.map((account) => account.split(':')[2]);

    if ([
      EIP155_SIGNING_METHODS.PERSONAL_SIGN,
      EIP155_SIGNING_METHODS.ETH_SIGN,
      EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA,
      EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V3,
      EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V4
    ].includes(method)) {
      const address = getEip155MessageAddress(method, request.params);

      this.#checkAccount(address, sessionAccounts);

      this.#koniState.evmSign(getWCId(id), url, method === EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA ? EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V4 : method, request.params, sessionAccounts)
        .then(async (signature) => {
          await this.#walletConnectService.responseRequest({
            topic: topic,
            response: formatJsonRpcResult(id, signature)
          });
        })
        .catch((e) => {
          this.#handleError(topic, id, e);
        });
    } else if (method === EIP155_SIGNING_METHODS.ETH_SEND_TRANSACTION) {
      const [tx] = parseRequestParams<EIP155_SIGNING_METHODS.ETH_SEND_TRANSACTION>(request.params);

      const address = tx.from;

      this.#checkAccount(address, sessionAccounts);

      const chainId = parseInt(_chainId.split(':')[1]);

      const [networkKey, chainInfo] = this.#koniState.findNetworkKeyByChainId(chainId);

      if (!networkKey || !chainInfo) {
        throw new Error(getSdkError('UNSUPPORTED_CHAINS').message + ' ' + address);
      }

      const chainState = this.#koniState.getChainStateByKey(networkKey);

      if (!chainState.active) {
        throw new Error(getSdkError('USER_REJECTED').message + ' Chain is not active: ' + chainInfo.name);
      }

      // const pair = keyring.getPair(param.address);

      this.#koniState.evmSendTransaction(getWCId(id), url, networkKey, sessionAccounts, tx)
        .then(async (signature) => {
          await this.#walletConnectService.responseRequest({
            topic: topic,
            response: formatJsonRpcResult(id, signature)
          });
        })
        .catch((e) => {
          this.#handleError(topic, id, e);
        });
    } else {
      throw Error(getSdkError('INVALID_METHOD').message + ' ' + method);
    }
  }
}
