// Copyright 2019 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { InjectedProvider } from '@polkadot/extension-inject/types';
import { SendRequest } from './types';
import EventEmitter from 'eventemitter3';

export default class PostMessageProvider implements InjectedProvider {

  private _eventemitter: EventEmitter;
  private _sendRequest: SendRequest;

  /**
   * @param {function}  sendRequest  The function to be called to send requests to the node
   */
  public constructor(sendRequest: SendRequest) {
    this._eventemitter = new EventEmitter();
    this._sendRequest = sendRequest; // or juste use postMessage... don't know yet. but re-using the existing logic would be nice

    // ici sendRequest('rpc.request', {method, params})
    // qui résolve avec la réponse de la requête

    // et si on fait subscribe
    // sendRequest('rpc.request', {method, params}) // (ou rpc.subscribe)

    this.websocket.onmessage = this.onResponse;
    this.emit('connected');
  }

  private emit(type: ProviderInterfaceEmitted, ...args: any[]): void {
    this._eventemitter.emit(type, ...args);
  }

  private onResponse = (message: MessageEvent): void => {
    l.debug((): any => ['received', message.data]);

    const response: JsonRpcResponse = JSON.parse(message.data as string);

    return isUndefined(response.method)
      ? this.onSocketMessageResult(response)
      : this.onSocketMessageSubscribe(response);
  }

  /**
   * @summary `true` when this provider supports subscriptions
   */
  public get hasSubscriptions(): boolean {
    return true;
  }

  /**
   * @description Returns a clone of the object
   */
  public clone(): PostMessageProvider {
    return new PostMessageProvider(this._sendRequest);
  }












  _constructMessage(id, data) {
    return Object.assign({}, data, {
      id,
      to: 'shell',
      from: this._appId,
      token: this._token
    });
  }

  _send(message) {
    const id = ++this.id;
    const postMessage = this._constructMessage(id, message.data);

    this._messages[id] = Object.assign({}, postMessage, message.options);
    this._destination.postMessage(postMessage, '*');
  }

  public send(method: string, params: any[], subscription?: SubscriptionHandler): Promise<any> {
    // window.postMessage({ id, message, origin: 'page', request }, '*');
    sendMessage('rpc.request', { method, params });
  }

}










class PostMessage extends EventEmitter {
  constructor(appId, destination, source) {
    super();

    this._appId = appId;
    this._destination = destination || window.parent;

    this.id = 0;
    this._connected = false;
    this._messages = {};
    this._queued = [];

    this._receiveMessage = this._receiveMessage.bind(this);
    this._send = this._send.bind(this);
    this.send = this.send.bind(this);
    this.subscribe = this.subscribe.bind(this);
    this.unsubscribe = this.unsubscribe.bind(this);

    (source || window).addEventListener('message', this._receiveMessage, false);
  }

  get isConnected() {
    return this._connected;
  }

  get isParity() {
    return true;
  }

  get queuedCount() {
    return this._queued.length;
  }

  setToken(token) {
    if (token) {
      this._connected = true;
      this._token = token;
      this.emit('connected');
      this._sendQueued();
    }
  }

  addMiddleware() {
  }

  _sendQueued() {
    if (!this._token) {
      return;
    }

    this._queued.forEach(this._send);
    this._queued = [];
  }

  subscribe(api, callback, params) {
    // console.log('paritySubscribe', JSON.stringify(params), api, callback);
    return new Promise((resolve, reject) => {
      this._send({
        data: {
          api,
          params
        },
        options: {
          callback,
          resolve,
          reject,
          subscription: true,
          initial: true
        }
      });
    });
  }

  // FIXME: Should return callback, not promise
  unsubscribe(subId) {
    return new Promise((resolve, reject) => {
      this._send({
        data: {
          subId
        },
        options: {
          callback: (error, result) => {
            error
              ? reject(error)
              : resolve(result);
          }
        }
      });
    });
  }

  unsubscribeAll() {
    return this.unsubscribe('*');
  }

  _receiveMessage({ data: { id, error, from, to, token, result }, origin, source }) {
    const isTokenValid = token
      ? token === this._token
      : true;

    if (from !== 'shell' || to !== this._appId || !isTokenValid) {
      return;
    }

    if (this._messages[id].subscription) {
      // console.log('subscription', result, 'initial?', this._messages[id].initial);
      this._messages[id].initial
        ? this._messages[id].resolve(result)
        : this._messages[id].callback(error && new Error(error), result);
      this._messages[id].initial = false;
    } else {
      this._messages[id].callback(error && new Error(error), result);
      this._messages[id] = null;
    }
  }
}

module.exports = PostMessage;
