// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import RequestService from '@subwallet/extension-base/services/request-service';
import TransactionService from '@subwallet/extension-base/services/transaction-service';
import { ALL_WALLET_CONNECT_EVENT, DEFAULT_WALLET_CONNECT_OPTIONS } from '@subwallet/extension-base/services/wallet-connect-service/constants';
import { convertConnectRequest } from '@subwallet/extension-base/services/wallet-connect-service/helpers';
import {
  WalletConnectSessionRequest,
  ResultApproveWalletConnectSession
} from '@subwallet/extension-base/services/wallet-connect-service/types';
import SignClient from '@walletconnect/sign-client';
import { PairingTypes, SignClientTypes } from '@walletconnect/types';
import { getSdkError } from '@walletconnect/utils';

export default class WalletConnectService {
  readonly #requestService: RequestService;
  readonly #transactionService: TransactionService;
  #client: SignClient | undefined;
  #option: SignClientTypes.Options;
  #pairs: PairingTypes.Struct[];

  constructor (requestService: RequestService, transactionService: TransactionService, option: SignClientTypes.Options = DEFAULT_WALLET_CONNECT_OPTIONS) {
    this.#requestService = requestService;
    this.#transactionService = transactionService;
    this.#option = option;
    this.#initClient().catch(console.error);
  }

  async #initClient () {
    this.#removeListener();
    this.#client = await SignClient.init(this.#option);
    this.#pairs = this.#client.pairing.values;
    this.#createListener();
  }

  #onSessionProposal (proposal: SignClientTypes.EventArguments['session_proposal']) {
    this.#checkClient();

    this.#requestService.addConnectWCRequest(convertConnectRequest(proposal));
  }

  #createListener () {
    this.#client?.on('session_proposal', this.#onSessionProposal.bind(this));
    this.#client?.on('session_ping', (data) => console.log('ping', data));
    this.#client?.on('session_event', (data) => console.log('event', data));
    this.#client?.on('session_update', (data) => console.log('update', data));
    this.#client?.on('session_delete', (data) => console.log('delete', data));
  }

  // Remove old listener
  #removeListener () {
    ALL_WALLET_CONNECT_EVENT.forEach((event) => {
      this.#client?.removeAllListeners(event);
    });
  }

  #checkClient () {
    if (!this.#client) {
      throw new Error('WalletConnect is not initialized');
    }
  }

  public async changeOption (newOption: Omit<SignClientTypes.Options, 'projectId'>) {
    this.#option = Object.assign({}, this.#option, newOption);
    await this.#initClient();
  }

  public getSessions () {
    this.#checkClient();

    console.log(this.#client?.session.values);
  }

  public async connect (uri: string) {
    this.#checkClient();

    await this.#client?.pair({ uri });
  }

  public async approveSession (result: ResultApproveWalletConnectSession) {
    this.#checkClient();
    await this.#client?.approve(result);
  }

  public async rejectSession (id: number) {
    this.#checkClient();
    await this.#client?.reject({
      id: id,
      reason: getSdkError('USER_REJECTED')
    });
  }
}
