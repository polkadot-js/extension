// Copyright 2019 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { InjectedProvider } from '@polkadot/extension-inject/types';
import Coder from '@polkadot/rpc-provider/coder';
import { ProviderInterfaceEmitCb, ProviderInterfaceEmitted } from '@polkadot/rpc-provider/types';
import { AnyFunction } from '@polkadot/types/types';
import { isUndefined, logger } from '@polkadot/util';
import EventEmitter from 'eventemitter3';

import { SendRequest } from './types';

const l = logger('PostMessageProvider');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CallbackHandler = (error?: null | Error, value?: any) => void;

// Same as https://github.com/polkadot-js/api/blob/57ca9a9c3204339e1e1f693fcacc33039868dc27/packages/rpc-provider/src/ws/Provider.ts#L17
interface SubscriptionHandler {
  callback: CallbackHandler;
  type: string;
}

/**
 * @name PostMessageProvider
 *
 * @description Extension provider to be used by dapps
 */
export default class PostMessageProvider implements InjectedProvider {
  readonly #coder: Coder;

  readonly #eventemitter: EventEmitter;

  readonly #sendRequest: SendRequest;

  // Subscription IDs are (historically) not guaranteed to be globally unique;
  // only unique for a given subscription method; which is why we identify
  // the subscriptions based on subscription id + type
  readonly #subscriptions: Record<string, AnyFunction> = {}; // {[(type,subscriptionId)]: callback}

  /**
   * @param {function}  sendRequest  The function to be called to send requests to the node
   * @param {function}  subscriptionNotificationHandler  Channel for receiving subscription messages
   */
  public constructor (sendRequest: SendRequest) {
    this.#coder = new Coder();
    this.#eventemitter = new EventEmitter();
    this.#sendRequest = sendRequest;

    // Give subscribers time to subscribe
    setTimeout((): void => {
      this.#eventemitter.emit('connected');
    });
  }

  /**
   * @description Returns a clone of the object
   */
  public clone (): PostMessageProvider {
    return new PostMessageProvider(this.#sendRequest);
  }

  /**
   * @description Manually disconnect from the connection, clearing autoconnect logic
   */
  public disconnect (): void {
    console.error('PostMessageProvider.disconnect() is not implemented.');
  }

  /**
   * @summary `true` when this provider supports subscriptions
   */
  public get hasSubscriptions (): boolean {
    return true;
  }

  /**
   * @summary Whether the node is connected or not.
   * @return {boolean} true if connected
   */
  public isConnected (): boolean {
    return true; // connects on first RPC request
  }

  /**
   * @summary Listens on events after having subscribed using the [[subscribe]] function.
   * @param  {ProviderInterfaceEmitted} type Event
   * @param  {ProviderInterfaceEmitCb}  sub  Callback
   * @return unsubscribe function
   */
  public on (type: ProviderInterfaceEmitted, sub: ProviderInterfaceEmitCb): () => void {
    this.#eventemitter.on(type, sub);

    return (): void => {
      this.#eventemitter.removeListener(type, sub);
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public send (method: string, params: any[], subscription?: SubscriptionHandler): Promise<any> {
    const json = this.#coder.encodeObject(method, params);

    if (subscription) {
      const { callback, type } = subscription;
      return this.#sendRequest('pub(rpc.subscribe)', json).then(({ id }): number => {
        this.#subscriptions[`${type}::${id}`] = callback;

        return id;
      });
    } else {
      return this.#sendRequest('pub(rpc.send)', json);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async subscribe (type: string, method: string, params: any[], callback: AnyFunction): Promise<number> {
    const id = await this.send(method, params, { type, callback });

    return id as number;
  }

  /**
   * @summary Allows unsubscribing to subscriptions made with [[subscribe]].
   */
  public async unsubscribe (type: string, method: string, id: number): Promise<boolean> {
    const subscription = `${type}::${id}`;

    // FIXME This now could happen with re-subscriptions. The issue is that with a re-sub
    // the assigned id now does not match what the API user originally received. It has
    // a slight complication in solving - since we cannot rely on the send id, but rather
    // need to find the actual subscription id to map it
    if (isUndefined(this.#subscriptions[subscription])) {
      l.debug((): string => `Unable to find active subscription=${subscription}`);

      return false;
    }

    delete this.#subscriptions[subscription];

    const result = await this.send(method, [id]);

    return result as boolean;
  }
}
