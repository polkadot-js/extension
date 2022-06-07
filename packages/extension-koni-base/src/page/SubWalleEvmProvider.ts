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

  request ({ method, params }: RequestArguments): Promise<any> {
    switch (method) {
      case 'eth_requestAccounts':
        return new Promise((resolve) => {
          this.sendMessage('pub(authorize.tabV2)', { origin: 'eth_requestAccounts', accountAuthType: 'evm' })
            .then(() => {
              // Todo: Chain this to subscribe account and emit accountsChanged events
              this.sendMessage('pub(accounts.listV2)', { accountAuthType: 'evm' })
                .then((accounts) => {
                  return resolve(accounts.map((acc) => (acc.address)));
                })
                .catch(console.error);
            })
            .catch(console.error);
        });
      case 'eth_accounts':
        return new Promise((resolve) => {
          this.sendMessage('pub(accounts.listV2)', { accountAuthType: 'evm' })
            .then((accounts) => {
              const accList = accounts.map((acc) => acc.address);

              accList.length > 0 ? resolve([accList[0]]) : resolve([]);
            }).catch(console.error);
        });
      default:
        return Promise.resolve(undefined);
    }
  }

  send (payload: JsonRpcPayload, callback: (error: (Error | null), result?: JsonRpcResponse) => void): void {
    console.log(payload, callback);
  }

  sendAsync (payload: JsonRpcPayload, callback: (error: (Error | null), result?: JsonRpcResponse) => void): void {
    console.log(payload, callback);
  }
}
