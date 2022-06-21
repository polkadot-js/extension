// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { EvmProvider } from '@subwallet/extension-inject/types';

import SafeEventEmitter from '@metamask/safe-event-emitter';
import { SendRequest } from '@subwallet/extension-base/page/types';
import { RequestArguments } from 'web3-core';
import { JsonRpcPayload, JsonRpcResponse } from 'web3-core-helpers';

export class SubWalletEvmProvider extends SafeEventEmitter implements EvmProvider {
  public readonly isSubWallet = true;
  public readonly isMetaMask = false;
  public readonly version;
  protected sendMessage: SendRequest;
  protected _connected = false;
  protected _subscribed = false;

  constructor (sendMessage: SendRequest, version: string) {
    super();
    this.version = version;
    this.sendMessage = sendMessage;
    this._connected = true;
  }

  get connected () {
    return this._connected;
  }

  public isConnected () {
    return this._connected;
  }

  protected subscribeExtensionEvents () {
    if (this._subscribed) {
      return;
    }

    this.sendMessage('evm(events.subscribe)', null, ({ payload, type }) => {
      if (['connect', 'disconnect', 'accountsChanged', 'chainChanged', 'message', 'data', 'reconnect', 'error'].includes(type)) {
        if (type === 'connect') {
          this._connected = true;
        } else if (type === 'disconnect') {
          this._connected = false;
        }

        const finalType = type === 'data' ? 'message' : type;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        this.emit(finalType, payload);
      } else {
        console.warn('Can not handle event', type, payload);
      }
    })
      .then((done) => {
        this._subscribed = done;
      }).catch(console.error);
  }

  request<T> ({ method, params }: RequestArguments): Promise<T> {
    switch (method) {
      case 'eth_requestAccounts':
        return new Promise((resolve, reject) => {
          const origin = document.title !== '' ? document.title : window.location.hostname;

          this.sendMessage('pub(authorize.tabV2)', { origin, accountAuthType: 'evm' })
            .then(() => {
              // Subscribe event
              this.subscribeExtensionEvents();

              // Return account list
              this.request<string[]>({ method: 'eth_accounts' })
                .then((accounts) => {
                  // @ts-ignore
                  resolve(accounts);
                }
                ).catch(reject);
            })
            .catch(reject);
        });
      default:
        return new Promise((resolve, reject) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          this.sendMessage('evm(request)', { params, method })
            .then((result) => {
              resolve(result as T);
            })
            .catch((e) => {
              reject(e);
            });
        });
    }
  }

  send (payload: JsonRpcPayload, callback: (error: (Error | null), result?: JsonRpcResponse) => void): void {
    this.sendMessage('evm(provider.send)', payload, ({ error, result }) => {
      callback(error, result);
    }).catch(console.error);
  }

  sendAsync (payload: JsonRpcPayload, callback: (error: (Error | null), result?: JsonRpcResponse) => void): void {
    this.sendMessage('evm(provider.send)', payload, ({ error, result }) => {
      callback(error, result);
    }).catch(console.error);
  }
}
