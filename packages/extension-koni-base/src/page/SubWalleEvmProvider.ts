// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { EvmProvider } from '@subwallet/extension-inject/types';

import SafeEventEmitter from '@metamask/safe-event-emitter';
import { SendRequest } from '@subwallet/extension-base/page/types';
import { RequestArguments } from 'web3-core';
import { JsonRpcPayload } from 'web3-core-helpers';

import { JsonRpcResponse } from '@polkadot/rpc-provider/types';

export class SubWalletEvmProvider extends SafeEventEmitter implements EvmProvider {
  public readonly isSubWallet = true;
  public readonly isMetaMask = false;
  public readonly version;
  protected sendMessage: SendRequest;

  constructor (sendMessage: SendRequest, version: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super();
    this.version = version;
    this.sendMessage = sendMessage;
    // Todo: only connect and really start provider if have at least on request
  }

  get connected () {
    return true;
  }

  public isConnected () {
    return this.connected;
  }

  protected subscribeExtensionEvents () {
    this.sendMessage('evm(events.subscribe)', null, ({ payload, type }) => {
      if (['connect', 'disconnect', 'accountsChanged', 'chainChanged', 'message'].includes(type)) {
        console.log(type, payload);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        this.emit(type, payload);
      } else {
        console.error('Can not handle event', type, payload);
      }
    })
      .then((done) => {
        console.log('Start subscribe events from SubWallet');
      }).catch(console.error);
  }

  request<T> ({ method, params }: RequestArguments): Promise<T> {
    switch (method) {
      case 'eth_requestAccounts':
        return new Promise((resolve) => {
          this.sendMessage('pub(authorize.tabV2)', { origin: 'eth_requestAccounts', accountAuthType: 'evm' })
            .then(() => {
              // Subscribe event
              this.subscribeExtensionEvents();

              // Return account list
              this.request<string[]>({ method: 'eth_accounts' })
                .then((accounts) => {
                  // @ts-ignore
                  resolve(accounts);
                }
                ).catch(console.error);
            })
            .catch(console.error);
        });
      default:
        return new Promise((resolve, reject) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          this.sendMessage('evm(request)', { params, method })
            .then((result) => {
              resolve(result as T);
            })
            .catch((e) => {
              console.error(e);
              reject(e);
            });
        });
    }
  }

  send (payload: JsonRpcPayload, callback: (error: (Error | null), result?: JsonRpcResponse) => void): void {
    console.log(payload, callback);
  }

  sendAsync (payload: JsonRpcPayload, callback: (error: (Error | null), result?: JsonRpcResponse) => void): void {
    console.log(payload, callback);
  }
}
