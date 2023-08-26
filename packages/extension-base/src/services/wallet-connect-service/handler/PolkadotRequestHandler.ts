// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { formatJsonRpcError, formatJsonRpcResult } from '@json-rpc-tools/utils';
import RequestBytesSign from '@subwallet/extension-base/background/RequestBytesSign';
import RequestExtrinsicSign from '@subwallet/extension-base/background/RequestExtrinsicSign';
import RequestService from '@subwallet/extension-base/services/request-service';
import WalletConnectService from '@subwallet/extension-base/services/wallet-connect-service';
import { getWCId, parseRequestParams } from '@subwallet/extension-base/services/wallet-connect-service/helpers';
import { POLKADOT_SIGNING_METHODS } from '@subwallet/extension-base/services/wallet-connect-service/types';
import { isSameAddress } from '@subwallet/extension-base/utils';
import keyring from '@subwallet/ui-keyring';
import { SignClientTypes } from '@walletconnect/types';
import { getSdkError } from '@walletconnect/utils';

export default class PolkadotRequestHandler {
  readonly #walletConnectService: WalletConnectService;
  readonly #requestService: RequestService;

  constructor (walletConnectService: WalletConnectService, requestService: RequestService) {
    this.#walletConnectService = walletConnectService;
    this.#requestService = requestService;
  }

  #checkAccount (address: string, accounts: string[]) {
    if (!accounts.find((account) => isSameAddress(account, address))) {
      throw new Error(getSdkError('UNSUPPORTED_ACCOUNTS').message + ' ' + address);
    }
  }

  #handleError (topic: string, id: number, e: unknown) {
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
    const { request } = params;
    const method = request.method as POLKADOT_SIGNING_METHODS;
    const requestSession = this.#walletConnectService.getSession(topic);

    const url = requestSession.peer.metadata.url;
    const sessionAccounts = requestSession.namespaces.polkadot.accounts.map((account) => account.split(':')[2]);

    if (method === POLKADOT_SIGNING_METHODS.POLKADOT_SIGN_MESSAGE) {
      const param = parseRequestParams<POLKADOT_SIGNING_METHODS.POLKADOT_SIGN_MESSAGE>(request.params);

      this.#checkAccount(param.address, sessionAccounts);

      const pair = keyring.getPair(param.address);
      const address = pair.address;

      this.#requestService
        .sign(url, new RequestBytesSign({ address: address, data: param.message, type: 'bytes' }), { address, ...pair.meta }, getWCId(id))
        .then(async ({ signature }) => {
          await this.#walletConnectService.responseRequest({
            topic: topic,
            response: formatJsonRpcResult(id, { signature })
          });
        })
        .catch((e) => {
          this.#handleError(topic, id, e);
        });
    } else if (method === POLKADOT_SIGNING_METHODS.POLKADOT_SIGN_TRANSACTION) {
      const param = parseRequestParams<POLKADOT_SIGNING_METHODS.POLKADOT_SIGN_TRANSACTION>(request.params);

      this.#checkAccount(param.address, sessionAccounts);

      const pair = keyring.getPair(param.address);
      const address = pair.address;

      this.#requestService
        .sign(url, new RequestExtrinsicSign(param.transactionPayload), { address, ...pair.meta }, getWCId(id))
        .then(async ({ signature }) => {
          await this.#walletConnectService.responseRequest({
            topic: topic,
            response: formatJsonRpcResult(id, { signature })
          });
        })
        .catch((e) => {
          this.#handleError(topic, id, e);
        });
    } else {
      throw Error(`${getSdkError('INVALID_METHOD').message} ${method as string}`);
    }
  }
}
