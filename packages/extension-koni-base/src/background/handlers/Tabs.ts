// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { InjectedAccount } from '@subwallet/extension-inject/types';

import { AuthUrls } from '@subwallet/extension-base/background/handlers/State';
import { createSubscription, unsubscribe } from '@subwallet/extension-base/background/handlers/subscriptions';
import Tabs from '@subwallet/extension-base/background/handlers/Tabs';
import { EvmAppState, EvmEventType, EvmProviderRpcError, RequestEvmProviderSend } from '@subwallet/extension-base/background/KoniTypes';
import { AccountAuthType, MessageTypes, RequestAccountList, RequestAccountSubscribe, RequestAuthorizeTab, RequestTypes, ResponseTypes } from '@subwallet/extension-base/background/types';
import { canDerive } from '@subwallet/extension-base/utils';
import KoniState from '@subwallet/extension-koni-base/background/handlers/State';
import { ALL_ACCOUNT_KEY, CRON_GET_API_MAP_STATUS, EVM_PROVIDER_RPC_ERRORS } from '@subwallet/extension-koni-base/constants';
import { RequestArguments, WebsocketProvider } from 'web3-core';
import { JsonRpcPayload } from 'web3-core-helpers';

import { accounts as accountsObservable } from '@polkadot/ui-keyring/observable/accounts';
import { SingleAddress, SubjectInfo } from '@polkadot/ui-keyring/observable/types';
import { assert } from '@polkadot/util';

function stripUrl (url: string): string {
  assert(url && (url.startsWith('http:') || url.startsWith('https:') || url.startsWith('ipfs:') || url.startsWith('ipns:')), `Invalid url ${url}, expected to start with http: or https: or ipfs: or ipns:`);

  const parts = url.split('/');

  return parts[2];
}

function transformAccountsV2 (accounts: SubjectInfo, anyType = false, url: string, authList: AuthUrls, accountAuthType?: AccountAuthType): InjectedAccount[] {
  const shortenUrl = stripUrl(url);
  const accountSelected = Object.keys(authList[shortenUrl].isAllowedMap)
    .filter((address) => authList[shortenUrl].isAllowedMap[address]);

  let authTypeFilter = ({ type }: SingleAddress) => true;

  if (accountAuthType === 'substrate') {
    authTypeFilter = ({ type }: SingleAddress) => (type !== 'ethereum');
  } else if (accountAuthType === 'evm') {
    authTypeFilter = ({ type }: SingleAddress) => (type === 'ethereum');
  }

  return Object
    .values(accounts)
    .filter(({ json: { meta: { isHidden } } }) => !isHidden)
    .filter(({ type }) => anyType ? true : canDerive(type))
    .filter(authTypeFilter)
    .filter(({ json: { address } }) => accountSelected.includes(address))
    .sort((a, b) => (a.json.meta.whenCreated || 0) - (b.json.meta.whenCreated || 0))
    .map(({ json: { address, meta: { genesisHash, name } }, type }): InjectedAccount => ({
      address,
      genesisHash,
      name,
      type
    }));
}

export default class KoniTabs extends Tabs {
  readonly #koniState: KoniState;
  private evmState: EvmAppState;

  constructor (koniState: KoniState) {
    super(koniState);
    this.#koniState = koniState;
    this.evmState = {};
  }

  private async accountsListV2 (url: string, { accountAuthType, anyType }: RequestAccountList): Promise<InjectedAccount[]> {
    const authList = await this.#koniState.getAuthList();

    return transformAccountsV2(accountsObservable.subject.getValue(), anyType, url, authList, accountAuthType);
  }

  private accountsSubscribeV2 (url: string, { accountAuthType }: RequestAccountSubscribe, id: string, port: chrome.runtime.Port): boolean {
    const cb = createSubscription<'pub(accounts.subscribeV2)'>(id, port);
    const subscription = accountsObservable.subject.subscribe((accounts: SubjectInfo): void => {
      this.#koniState.getAuthorize((value) => {
        cb(transformAccountsV2(accounts, false, url, value, accountAuthType));
      });
    }
    );

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
      subscription.unsubscribe();
    });

    return true;
  }

  private authorizeV2 (url: string, request: RequestAuthorizeTab): Promise<boolean> {
    return this.#koniState.authorizeUrlV2(url, request);
  }

  private async getEvmCurrentAccount (url: string): Promise<string[]> {
    return await new Promise((resolve) => {
      this.#koniState.getAuthorize((authUrls) => {
        const allAccounts = accountsObservable.subject.getValue();
        const accountList = transformAccountsV2(allAccounts, false, url, authUrls, 'evm').map((a) => a.address);
        let accounts: string[] = [];

        this.#koniState.getCurrentAccount(({ address }) => {
          if (address === ALL_ACCOUNT_KEY) {
            accounts = (accountList);
          } else if (address && accountList.includes(address)) {
            accounts = ([address]);
          }

          resolve(accounts);
        });
      });
    });
  }

  private async getEvmCurrentChainId (): Promise<string | undefined> {
    return await new Promise((resolve) => {
      this.#koniState.getCurrentAccount(({ currentGenesisHash }) => {
        const [networkKey, currentNetwork] = this.#koniState.findNetworkKeyByGenesisHash(currentGenesisHash);
        const chainId = currentNetwork?.evmChainId;

        if (chainId) {
          this.evmState.chainId = chainId.toString(16);
          this.evmState.networkKey = networkKey;
          // @ts-ignore
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          this.evmState.web3 = this.#koniState.getWeb3ApiMap()[networkKey];
        } else {
          this.evmState.chainId = undefined;
          this.evmState.networkKey = undefined;
          this.evmState.web3 = undefined;
        }

        resolve(this.evmState.chainId);
      });
    });
  }

  private createEvmProviderRpcError ([code, name, description]: [number, string, string], data?: unknown) {
    return {
      message: description,
      code: code,
      data: data || name
    } as EvmProviderRpcError;
  }

  private async evmSubscribeEvents (url: string, id: string, port: chrome.runtime.Port) {
    // This method will be called after DApp request connect to extension
    const cb = createSubscription<'evm(events.subscribe)'>(id, port);
    let isConnected = false;

    const emitEvent = (eventName: EvmEventType, payload: any) => {
      // eslint-disable-next-line node/no-callback-literal
      cb({ type: eventName, payload: payload });
    };

    let currentAccountList = await this.getEvmCurrentAccount(url);

    const checkAndTriggerChange = async () => {
      const newAccountList = await this.getEvmCurrentAccount(url);

      // Compare to void looping reload
      if (JSON.stringify(currentAccountList) !== JSON.stringify(newAccountList)) {
        // eslint-disable-next-line node/no-callback-literal
        emitEvent('accountsChanged', newAccountList);
        currentAccountList = newAccountList;
      }

      const currentChainId = this.evmState.chainId;
      const newChainId = await this.getEvmCurrentChainId();

      if (currentChainId !== newChainId) {
        emitEvent('chainChanged', newChainId);
      }
    };

    const accountListSubscription = accountsObservable.subject
      .subscribe((accounts: SubjectInfo): void => {
        setTimeout(() => {
          checkAndTriggerChange().catch(console.error);
        }, 50);
      });

    const networkCheck = () => {
      this.evmState.web3?.eth.net.isListening()
        .then((connecting) => {
          if (connecting && !isConnected) {
            emitEvent('connect', { chainId: this.evmState.chainId });
          } else if (!connecting && isConnected) {
            emitEvent('disconnect', this.createEvmProviderRpcError(EVM_PROVIDER_RPC_ERRORS.CHAIN_DISCONNECTED));
          }

          isConnected = connecting;
        })
        .catch(console.log);
    };

    const networkCheckInterval = setInterval(networkCheck, CRON_GET_API_MAP_STATUS);

    const provider = await this.getEvmProvider();

    const eventMap: Record<string, any> = {};

    eventMap.data = ({ method, params }: JsonRpcPayload) => {
      emitEvent('message', {
        type: method,
        data: params
      });
    };

    eventMap.error = (rs: Error) => {
      emitEvent('error', rs);
    };

    Object.entries(eventMap).forEach(([event, callback]) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      provider?.on(event, callback);
    });

    port.onDisconnect.addListener((): void => {
      Object.entries(eventMap).forEach(([event, callback]) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        provider?.removeListener(event, callback);
      });
      unsubscribe(id);
      accountListSubscription.unsubscribe();
      clearInterval(networkCheckInterval);
    });

    return true;
  }

  private async getEvmProvider (): Promise<WebsocketProvider | undefined> {
    let provider = this.evmState.web3?.currentProvider as WebsocketProvider;

    if (!provider) {
      await this.getEvmCurrentChainId();
      provider = this.evmState.web3?.currentProvider as WebsocketProvider;
    }

    return provider;
  }

  private async performWeb3Method (id: string, { method, params }: RequestArguments, callback?: (result?: any) => void) {
    const provider = await this.getEvmProvider();

    if (!provider) {
      return Promise.reject(this.createEvmProviderRpcError(EVM_PROVIDER_RPC_ERRORS.CHAIN_DISCONNECTED));
    }

    return new Promise((resolve, reject) => {
      provider?.send({
        jsonrpc: '2.0',
        method: method,
        params: params as any[],
        id
      }, (error, result) => {
        const err = result?.error || error;

        if (err) {
          reject(err);
        } else {
          const rs = result?.result as unknown;

          callback && callback(rs);
          resolve(rs);
        }
      });
    });
  }

  private async handleEvmRequest (id: string, url: string, request: RequestArguments): Promise<unknown> {
    const { method } = request;

    console.debug('Handle evm request', method);

    switch (method) {
      case 'eth_accounts':
        return await this.getEvmCurrentAccount(url);

      default:
        return this.performWeb3Method(id, request);
    }
  }

  private handleEvmSend (id: string, port: chrome.runtime.Port, request: RequestEvmProviderSend) {
    const cb = createSubscription<'evm(provider.send)'>(id, port);
    const provider = this.evmState.web3?.currentProvider as WebsocketProvider;

    provider.send(request, (error, result?) => {
      // eslint-disable-next-line node/no-callback-literal
      cb({ error, result });

      unsubscribe(id);
    });

    return true;
  }

  public override async handle<TMessageType extends MessageTypes> (id: string, type: TMessageType, request: RequestTypes[TMessageType], url: string, port: chrome.runtime.Port): Promise<ResponseTypes[keyof ResponseTypes]> {
    if (type === 'pub(phishing.redirectIfDenied)') {
      return this.redirectIfPhishing(url);
    }

    if (type !== 'pub(authorize.tabV2)') {
      this.#koniState.ensureUrlAuthorizedV2(url);
    }

    switch (type) {
      case 'pub(authorize.tabV2)':
        return this.authorizeV2(url, request as RequestAuthorizeTab);
      case 'pub(accounts.listV2)':
        return this.accountsListV2(url, request as RequestAccountList);
      case 'pub(accounts.subscribeV2)':
        return this.accountsSubscribeV2(url, request as RequestAccountSubscribe, id, port);
      case 'evm(events.subscribe)':
        return await this.evmSubscribeEvents(url, id, port);
      case 'evm(request)':
        return await this.handleEvmRequest(id, url, request as RequestArguments);
      case 'evm(provider.send)':
        return this.handleEvmSend(id, port, request as RequestEvmProviderSend);
      default:
        return super.handle(id, type, request, url, port);
    }
  }
}
