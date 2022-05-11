"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _eventemitter = _interopRequireDefault(require("eventemitter3"));

var _util = require("@polkadot/util");

// Copyright 2019-2022 @polkadot/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0
const l = (0, _util.logger)('PostMessageProvider');
// External to class, this.# is not private enough (yet)
let sendRequest;
/**
 * @name PostMessageProvider
 *
 * @description Extension provider to be used by dapps
 */

class PostMessageProvider {
  #eventemitter; // Whether or not the actual extension background provider is connected

  #isConnected = false; // Subscription IDs are (historically) not guaranteed to be globally unique;
  // only unique for a given subscription method; which is why we identify
  // the subscriptions based on subscription id + type

  #subscriptions = {}; // {[(type,subscriptionId)]: callback}

  /**
   * @param {function}  sendRequest  The function to be called to send requests to the node
   * @param {function}  subscriptionNotificationHandler  Channel for receiving subscription messages
   */

  constructor(_sendRequest) {
    this.#eventemitter = new _eventemitter.default();
    sendRequest = _sendRequest;
  }
  /**
   * @description Returns a clone of the object
   */


  clone() {
    return new PostMessageProvider(sendRequest);
  }
  /**
   * @description Manually disconnect from the connection, clearing autoconnect logic
   */
  // eslint-disable-next-line @typescript-eslint/require-await


  async connect() {
    // FIXME This should see if the extension's state's provider can disconnect
    console.error('PostMessageProvider.disconnect() is not implemented.');
  }
  /**
   * @description Manually disconnect from the connection, clearing autoconnect logic
   */
  // eslint-disable-next-line @typescript-eslint/require-await


  async disconnect() {
    // FIXME This should see if the extension's state's provider can disconnect
    console.error('PostMessageProvider.disconnect() is not implemented.');
  }
  /**
   * @summary `true` when this provider supports subscriptions
   */


  get hasSubscriptions() {
    // FIXME This should see if the extension's state's provider has subscriptions
    return true;
  }
  /**
   * @summary Whether the node is connected or not.
   * @return {boolean} true if connected
   */


  get isConnected() {
    return this.#isConnected;
  }

  listProviders() {
    return sendRequest('pub(rpc.listProviders)', undefined);
  }
  /**
   * @summary Listens on events after having subscribed using the [[subscribe]] function.
   * @param  {ProviderInterfaceEmitted} type Event
   * @param  {ProviderInterfaceEmitCb}  sub  Callback
   * @return unsubscribe function
   */


  on(type, sub) {
    this.#eventemitter.on(type, sub);
    return () => {
      this.#eventemitter.removeListener(type, sub);
    };
  } // eslint-disable-next-line @typescript-eslint/no-explicit-any


  async send(method, params, _, subscription) {
    if (subscription) {
      const {
        callback,
        type
      } = subscription;
      const id = await sendRequest('pub(rpc.subscribe)', {
        method,
        params,
        type
      }, res => {
        subscription.callback(null, res);
      });
      this.#subscriptions[`${type}::${id}`] = callback;
      return id;
    }

    return sendRequest('pub(rpc.send)', {
      method,
      params
    });
  }
  /**
   * @summary Spawn a provider on the extension background.
   */


  async startProvider(key) {
    // Disconnect from the previous provider
    this.#isConnected = false;
    this.#eventemitter.emit('disconnected');
    const meta = await sendRequest('pub(rpc.startProvider)', key); // eslint-disable-next-line @typescript-eslint/no-floating-promises

    sendRequest('pub(rpc.subscribeConnected)', null, connected => {
      this.#isConnected = connected;

      if (connected) {
        this.#eventemitter.emit('connected');
      } else {
        this.#eventemitter.emit('disconnected');
      }

      return true;
    });
    return meta;
  }

  subscribe(type, method, params, callback) {
    return this.send(method, params, false, {
      callback,
      type
    });
  }
  /**
   * @summary Allows unsubscribing to subscriptions made with [[subscribe]].
   */


  async unsubscribe(type, method, id) {
    const subscription = `${type}::${id}`; // FIXME This now could happen with re-subscriptions. The issue is that with a re-sub
    // the assigned id now does not match what the API user originally received. It has
    // a slight complication in solving - since we cannot rely on the send id, but rather
    // need to find the actual subscription id to map it

    if ((0, _util.isUndefined)(this.#subscriptions[subscription])) {
      l.debug(() => `Unable to find active subscription=${subscription}`);
      return false;
    }

    delete this.#subscriptions[subscription];
    return this.send(method, [id]);
  }

}

exports.default = PostMessageProvider;