// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { InjectedAccount } from '@subwallet/extension-inject/types';

import { AuthUrlInfo } from '@subwallet/extension-base/background/handlers/State';
import { createSubscription, unsubscribe } from '@subwallet/extension-base/background/handlers/subscriptions';
import Tabs from '@subwallet/extension-base/background/handlers/Tabs';
import { CustomEvmToken, EvmAppState, EvmEventType, EvmSendTransactionParams, NetworkJson, RequestEvmProviderSend } from '@subwallet/extension-base/background/KoniTypes';
import { AccountAuthType, MessageTypes, RequestAccountList, RequestAccountSubscribe, RequestAuthorizeTab, RequestTypes, ResponseTypes } from '@subwallet/extension-base/background/types';
import { canDerive } from '@subwallet/extension-base/utils';
import { EvmRpcError } from '@subwallet/extension-koni-base/background/errors/EvmRpcError';
import KoniState from '@subwallet/extension-koni-base/background/handlers/State';
import { ALL_ACCOUNT_KEY, CRON_GET_API_MAP_STATUS } from '@subwallet/extension-koni-base/constants';
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

function transformAccountsV2 (accounts: SubjectInfo, anyType = false, authInfo?: AuthUrlInfo, accountAuthType?: AccountAuthType): InjectedAccount[] {
  const accountSelected = authInfo
    ? Object.keys(authInfo.isAllowedMap)
      .filter((address) => authInfo.isAllowedMap[address])
    : [];

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
  private evmEventEmitterMap: Record<string, Record<string, (eventName: EvmEventType, payload: any) => void>> = {};

  constructor (koniState: KoniState) {
    super(koniState);
    this.#koniState = koniState;
  }

  async getAuthInfo (url: string): Promise<AuthUrlInfo | undefined> {
    const authList = await this.#koniState.getAuthList();
    const shortenUrl = stripUrl(url);

    return authList[shortenUrl];
  }

  private async accountsListV2 (url: string, { accountAuthType, anyType }: RequestAccountList): Promise<InjectedAccount[]> {
    const authInfo = await this.getAuthInfo(url);

    return transformAccountsV2(accountsObservable.subject.getValue(), anyType, authInfo, accountAuthType);
  }

  private accountsSubscribeV2 (url: string, { accountAuthType }: RequestAccountSubscribe, id: string, port: chrome.runtime.Port): boolean {
    const cb = createSubscription<'pub(accounts.subscribeV2)'>(id, port);
    const subscription = accountsObservable.subject.subscribe((accounts: SubjectInfo): void => {
      this.getAuthInfo(url).then((authInfo) => {
        cb(transformAccountsV2(accounts, false, authInfo, accountAuthType));
      }).catch(console.error);
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

  private async getEvmCurrentAccount (url: string, getAll = false): Promise<string[]> {
    return await new Promise((resolve) => {
      this.getAuthInfo(url).then((authInfo) => {
        const allAccounts = accountsObservable.subject.getValue();
        const accountList = transformAccountsV2(allAccounts, false, authInfo, 'evm').map((a) => a.address);
        let accounts: string[] = [];

        this.#koniState.getCurrentAccount(({ address }) => {
          if (address === ALL_ACCOUNT_KEY || !accountList.includes(address) || getAll) {
            accounts = accountList;
          } else if (address && accountList.includes(address)) {
            accounts = ([address]);
          }

          resolve(accounts);
        });
      }).catch(console.error);
    });
  }

  private async getEvmState (url?: string): Promise<EvmAppState> {
    let currentEvmNetworkKey: string | undefined;

    if (url) {
      const authInfo = await this.getAuthInfo(url);

      currentEvmNetworkKey = authInfo?.currentEvmNetworkKey;
    }

    let currentEvmNetwork: NetworkJson | undefined = currentEvmNetworkKey ? this.#koniState.getNetworkMap()[currentEvmNetworkKey] : undefined;

    if (!currentEvmNetwork?.active) {
      currentEvmNetwork = Object.values(this.#koniState.getNetworkMap()).find((network) => (network.isEthereum && network.active));
    }

    if (currentEvmNetwork) {
      const { evmChainId, key } = currentEvmNetwork;
      const web3 = this.#koniState.getWeb3ApiMap()[key];

      return {
        networkKey: key,
        chainId: `0x${(evmChainId || 0).toString(16)}`,
        web3
      };
    } else {
      return {};
    }
  }

  private async getEvmPermission (url: string, id: string) {
    const accounts = await this.getEvmCurrentAccount(url, true);

    return [{ id: id, invoker: url, parentCapability: 'eth_accounts', caveats: [{ type: 'restrictReturnedAccounts', value: accounts }], date: new Date().getTime() }];
  }

  private async switchEvmChain (id: string, url: string, { params }: RequestArguments) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const chainId = params[0].chainId as string;

    const evmState = await this.getEvmState(url);

    if (evmState.chainId === chainId) {
      return null;
    }

    const [networkKey] = this.#koniState.findNetworkKeyByChainId(parseInt(chainId, 16));

    if (networkKey) {
      await this.#koniState.switchEvmNetworkByUrl(stripUrl(url), networkKey);
    } else {
      throw new EvmRpcError('INVALID_PARAMS', `Not found chainId ${chainId} in wallet`);
    }

    return null;
  }

  private async addEvmToken (id: string, url: string, { params }: RequestArguments) {
    const input = params as {
      type: string
      options: {
        address: string
        decimals: number
        image: string
        symbol: string
      }
    };

    const tokenType = input?.type?.toLowerCase() || '';

    if (tokenType !== 'erc20' && tokenType !== 'erc721') {
      throw new EvmRpcError('INVALID_PARAMS', `Assets type ${tokenType} is not supported`);
    }

    if (!input?.options?.address || !input?.options?.symbol) {
      throw new EvmRpcError('INVALID_PARAMS', 'Assets params require address and symbol');
    }

    const evmState = await this.getEvmState(url);
    const chain = evmState.networkKey;

    if (!chain) {
      throw new EvmRpcError('INTERNAL_ERROR', 'Current chain is not available');
    }

    try {
      const tokenInfo: CustomEvmToken = {
        type: tokenType,
        smartContract: input.options?.address,
        symbol: input.options?.symbol,
        decimals: input.options?.decimals,
        image: input.options?.image,
        chain
      };

      return await this.#koniState.addTokenConfirm(id, url, tokenInfo);
    } catch (e) {
      throw new EvmRpcError('INVALID_PARAMS', 'Invalid assets params');
    }
  }

  private async addEvmChain (id: string, url: string, { params }: RequestArguments) {
    const input = params as {
      chainId: string,
      rpcUrls: string[],
      chainName: string,
      blockExplorerUrls?: string[]
    }[];

    if (input && input.length > 0) {
      const { blockExplorerUrls, chainId, chainName, rpcUrls } = input[0];

      if (chainId) {
        const chainIdNum = parseInt(chainId, 16);
        const [networkKey] = this.#koniState.findNetworkKeyByChainId(chainIdNum);

        if (networkKey) {
          return await this.switchEvmChain(id, url, { method: 'wallet_switchEthereumChain', params: [{ chainId }] });
        }

        if (rpcUrls && chainName) {
          const providers: Record<string, string> = {};

          rpcUrls.forEach((url) => {
            providers[url] = url;
          });

          const ok = await this.#koniState.addNetworkConfirm(id, url, {
            key: '',
            genesisHash: '',
            groups: [],
            ss58Format: 0,
            isEthereum: true,
            chain: chainName,
            evmChainId: chainIdNum,
            active: true,
            providers,
            currentProvider: rpcUrls[0],
            currentProviderMode: 'ws',
            blockExplorer: blockExplorerUrls && blockExplorerUrls[0]
          });

          if (!ok) {
            throw new EvmRpcError('USER_REJECTED_REQUEST');
          }
        }
      }
    }

    return null;
  }

  private async getEvmCurrentChainId (url: string): Promise<string | undefined> {
    const evmState = await this.getEvmState(url);

    return evmState.chainId;
  }

  private async evmSubscribeEvents (url: string, id: string, port: chrome.runtime.Port) {
    // This method will be called after DApp request connect to extension
    const cb = createSubscription<'evm(events.subscribe)'>(id, port);
    let isConnected = false;

    const emitEvent = (eventName: EvmEventType, payload: any) => {
      // eslint-disable-next-line node/no-callback-literal
      cb({ type: eventName, payload: payload });
    };

    // Detect accounts changed
    let currentAccountList = await this.getEvmCurrentAccount(url);

    const onCurrentAccountChanged = async () => {
      const newAccountList = await this.getEvmCurrentAccount(url);

      // Compare to void looping reload
      if (JSON.stringify(currentAccountList) !== JSON.stringify(newAccountList)) {
        // eslint-disable-next-line node/no-callback-literal
        emitEvent('accountsChanged', newAccountList);
        currentAccountList = newAccountList;
      }
    };

    const accountListSubscription = this.#koniState.subscribeCurrentAccount()
      .subscribe(() => {
        onCurrentAccountChanged().catch(console.error);
      });

    // Detect network chain
    const evmState = await this.getEvmState(url);
    let currentChainId = evmState.chainId;

    const _onAuthChanged = async () => {
      const { chainId } = await this.getEvmState(url);

      if (chainId !== currentChainId) {
        emitEvent('chainChanged', chainId);
        currentChainId = chainId;
      }
    };

    const chainChainSubscription = this.#koniState.subscribeEvmChainChange()
      .subscribe((rs) => {
        _onAuthChanged().catch(console.error);
      });

    // Detect network connection
    const networkCheck = () => {
      this.getEvmState(url).then((evmState) => {
        evmState.web3?.eth.net.isListening()
          .then((connecting) => {
            if (connecting && !isConnected) {
              emitEvent('connect', { chainId: evmState.chainId });
            } else if (!connecting && isConnected) {
              emitEvent('disconnect', new EvmRpcError('CHAIN_DISCONNECTED'));
            }

            isConnected = connecting;
          })
          .catch(console.error);
      }).catch(console.error);
    };

    const networkCheckInterval = setInterval(networkCheck, CRON_GET_API_MAP_STATUS);

    const provider = await this.getEvmProvider(url);

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

    // Add event emitter
    if (!this.evmEventEmitterMap[url]) {
      this.evmEventEmitterMap[url] = {};
    }

    this.evmEventEmitterMap[url][id] = emitEvent;

    port.onDisconnect.addListener((): void => {
      if (this.evmEventEmitterMap[url][id]) {
        delete this.evmEventEmitterMap[url][id];
      }

      Object.entries(eventMap).forEach(([event, callback]) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        provider?.removeListener(event, callback);
      });
      unsubscribe(id);
      accountListSubscription.unsubscribe();
      chainChainSubscription.unsubscribe();
      clearInterval(networkCheckInterval);
    });

    return true;
  }

  private checkAndHandleProviderStatus (provider: WebsocketProvider | undefined) {
    if (!provider || !provider?.connected) {
      Object.values(this.evmEventEmitterMap).forEach((m) => {
        Object.values(m).forEach((emitter) => {
          emitter('disconnect', new EvmRpcError('CHAIN_DISCONNECTED'));
        });
      });
      throw new EvmRpcError('CHAIN_DISCONNECTED');
    }
  }

  private async getEvmProvider (url: string): Promise<WebsocketProvider | undefined> {
    const evmState = await this.getEvmState(url);
    let provider = evmState.web3?.currentProvider as WebsocketProvider;

    if (!provider) {
      await this.getEvmCurrentChainId(url);
      provider = evmState.web3?.currentProvider as WebsocketProvider;
    }

    return provider;
  }

  private async performWeb3Method (id: string, url: string, { method, params }: RequestArguments, callback?: (result?: any) => void) {
    const provider = await this.getEvmProvider(url);

    this.checkAndHandleProviderStatus(provider);

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

  public async canUseAccount (address: string, url: string) {
    const allowedAccounts = await this.getEvmCurrentAccount(url, true);

    return !!allowedAccounts.find((acc) => (acc.toLowerCase() === address.toLowerCase()));
  }

  private async evmSign (id: string, url: string, { method, params }: RequestArguments) {
    const allowedAccounts = (await this.getEvmCurrentAccount(url, true));
    const signResult = await this.#koniState.evmSign(id, url, method, params, allowedAccounts);

    if (signResult) {
      return signResult;
    } else {
      throw new EvmRpcError('INVALID_PARAMS', 'Have something wrong to sign message');
    }
  }

  public async evmSendTransaction (id: string, url: string, { params }: RequestArguments) {
    const transactionParams = (params as EvmSendTransactionParams[])[0];
    const canUseAccount = transactionParams.from && this.canUseAccount(transactionParams.from, url);
    const evmState = await this.getEvmState(url);
    const networkKey = evmState.networkKey;

    if (!canUseAccount) {
      throw new Error('Account ' + (transactionParams.from) + ' not in allowed list');
    }

    if (!networkKey) {
      throw new Error('Empty current network key');
    }

    const allowedAccounts = await this.getEvmCurrentAccount(url, true);
    const transactionHash = await this.#koniState.evmSendTransaction(id, url, networkKey, allowedAccounts, transactionParams);

    if (!transactionHash) {
      throw new EvmRpcError('USER_REJECTED_REQUEST');
    }

    return transactionHash;
  }

  private async handleEvmRequest (id: string, url: string, request: RequestArguments): Promise<unknown> {
    const { method } = request;

    console.log('method: ' + method);

    try {
      switch (method) {
        case 'eth_chainId':
          return await this.getEvmCurrentChainId(url);
        case 'eth_accounts':
          return await this.getEvmCurrentAccount(url);
        case 'eth_sendTransaction':
          return await this.evmSendTransaction(id, url, request);
        case 'eth_sign':
          return await this.evmSign(id, url, request);
        case 'personal_sign':
          return await this.evmSign(id, url, request);
        case 'eth_signTypedData':
          return await this.evmSign(id, url, request);
        case 'eth_signTypedData_v1':
          return await this.evmSign(id, url, request);
        case 'eth_signTypedData_v3':
          return await this.evmSign(id, url, request);
        case 'eth_signTypedData_v4':
          return await this.evmSign(id, url, request);
        case 'wallet_requestPermissions':
          await this.authorizeV2(url, { origin: '', accountAuthType: 'evm', reConfirm: true });

          return await this.getEvmPermission(url, id);
        case 'wallet_getPermissions':
          return await this.getEvmPermission(url, id);
        case 'wallet_addEthereumChain':
          return await this.addEvmChain(id, url, request);
        case 'wallet_switchEthereumChain':
          return await this.switchEvmChain(id, url, request);
        case 'wallet_watchAsset':
          return await this.addEvmToken(id, url, request);

        default:
          return this.performWeb3Method(id, url, request);
      }
    } catch (e) {
      // @ts-ignore
      if (e.code) {
        throw e;
      } else {
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        throw new EvmRpcError('INTERNAL_ERROR', e.message);
      }
    }
  }

  private async handleEvmSend (id: string, url: string, port: chrome.runtime.Port, request: RequestEvmProviderSend) {
    const cb = createSubscription<'evm(provider.send)'>(id, port);
    const evmState = await this.getEvmState(url);
    const provider = evmState.web3?.currentProvider as WebsocketProvider;

    this.checkAndHandleProviderStatus(provider);

    provider.send(request, (error, result?) => {
      // eslint-disable-next-line node/no-callback-literal
      cb({ error, result });

      unsubscribe(id);
    });

    return true;
  }

  public isEvmPublicRequest (type: string, request: RequestArguments) {
    if (type === 'evm(request)' && ['eth_chainId'].includes(request?.method)) {
      return true;
    } else {
      return false;
    }
  }

  public override async handle<TMessageType extends MessageTypes> (id: string, type: TMessageType, request: RequestTypes[TMessageType], url: string, port: chrome.runtime.Port): Promise<ResponseTypes[keyof ResponseTypes]> {
    if (type === 'pub(phishing.redirectIfDenied)') {
      return this.redirectIfPhishing(url);
    }

    if (type !== 'pub(authorize.tabV2)' && !this.isEvmPublicRequest(type, request as RequestArguments)) {
      await this.#koniState.ensureUrlAuthorizedV2(url)
        .catch((e: Error) => {
          if (type.startsWith('evm')) {
            throw new EvmRpcError('INTERNAL_ERROR', e.message);
          } else {
            throw e;
          }
        });
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
        return await this.handleEvmSend(id, url, port, request as RequestEvmProviderSend);
      default:
        return super.handle(id, type, request, url, port);
    }
  }
}
