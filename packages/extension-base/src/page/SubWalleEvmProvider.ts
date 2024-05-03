// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { EvmProvider } from '@subwallet/extension-inject/types';

import SafeEventEmitter from '@metamask/safe-event-emitter';
import { EvmProviderError } from '@subwallet/extension-base/background/errors/EvmProviderError';
import { SendRequest } from '@subwallet/extension-base/page/types';
import { JsonRpcRequest, JsonRpcResponse, JsonRpcSuccess } from 'json-rpc-engine';
import { RequestArguments } from 'web3-core';

export interface SendSyncJsonRpcRequest extends JsonRpcRequest<unknown> {
  method: 'net_version';
}

let subscribeFlag = false;

export class SubWalletEvmProvider extends SafeEventEmitter implements EvmProvider {
  public readonly isSubWallet = true;
  public readonly isMetaMask = false;
  public readonly version;
  protected sendMessage: SendRequest;
  protected _connected = false;

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
    if (subscribeFlag) {
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
        subscribeFlag = true;
      })
      .catch(() => {
        subscribeFlag = false;
      });

    subscribeFlag = true;
  }

  public async enable () {
    return this.request<string[]>({ method: 'eth_requestAccounts' });
  }

  public override on (eventName: string | symbol, listener: (...args: any[]) => void): this {
    this.subscribeExtensionEvents();
    super.on(eventName, listener);

    return this;
  }

  public override once (eventName: string | symbol, listener: (...args: any[]) => void): this {
    this.subscribeExtensionEvents();
    super.once(eventName, listener);

    return this;
  }

  request<T> ({ method, params }: RequestArguments): Promise<T> {
    // if (!this._isEnable) {
    //   if (method === 'eth_accounts') {
    //     return this.request<T>({ method: 'eth_requestAccounts' });
    //   }
    // }

    // Subscribe events
    switch (method) {
      case 'eth_requestAccounts':
        return new Promise((resolve, reject) => {
          const origin = document.title !== '' ? document.title : window.location.hostname;

          this.sendMessage('pub(authorize.tabV2)', { origin, accountAuthType: 'evm' })
            .then(() => {
              // Return account list
              this.request<string[]>({ method: 'eth_accounts' })
                .then((accounts) => {
                  // @ts-ignore
                  resolve(accounts);
                }).catch((e: EvmProviderError) => {
                  reject(e);
                });
            }).catch((e: EvmProviderError) => {
              reject(e);
            });
        });
      default:
        return new Promise((resolve, reject) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          this.sendMessage('evm(request)', { params, method })
            .then((result) => {
              resolve(result as T);
            })
            .catch((e: EvmProviderError) => {
              reject(e);
            });
        });
    }
  }

  private _sendSync (payload: JsonRpcRequest<unknown>): JsonRpcResponse<unknown> {
    let result: JsonRpcSuccess<unknown>['result'];

    switch (payload.method) {
      case 'net_version':
        result = this.version ? `SubWallet v${this.version}` : null;
        break;
      default:
        throw new Error(`Not support ${payload.method}`);
    }

    return {
      id: payload.id,
      jsonrpc: payload.jsonrpc,
      result
    };
  }

  send<T> (method: string, params?: T[]): Promise<JsonRpcResponse<T>>;
  send<T> (payload: JsonRpcRequest<unknown>, callback: (error: Error | null, result?: JsonRpcResponse<T>) => void): void;
  send<T> (payload: SendSyncJsonRpcRequest): JsonRpcResponse<T>;
  send (methodOrPayload: unknown, callbackOrArgs?: unknown): unknown {
    if (
      typeof methodOrPayload === 'string' &&
      (!callbackOrArgs || Array.isArray(callbackOrArgs))
    ) {
      return this.request({ method: methodOrPayload, params: callbackOrArgs });
    } else if (
      methodOrPayload &&
      typeof methodOrPayload === 'object' &&
      typeof callbackOrArgs === 'function'
    ) {
      return this.request(methodOrPayload as JsonRpcRequest<unknown>).then((rs) => {
        (callbackOrArgs as (...args: unknown[]) => void)(rs);
      });
    }

    return this._sendSync(methodOrPayload as SendSyncJsonRpcRequest);
  }

  sendAsync<T> (payload: JsonRpcRequest<T>, callback: (error: (Error | null), result?: JsonRpcResponse<T>) => void): void {
    this.request<T>(payload)
      .then((result) => {
        // @ts-ignore
        callback(null, { result });
      })
      .catch((e: EvmProviderError) => {
        callback(e);
      });
  }
}
