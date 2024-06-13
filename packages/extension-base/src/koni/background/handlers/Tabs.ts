// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { InjectedAccount } from '@subwallet/extension-inject/types';

import { _AssetType } from '@subwallet/chain-list/types';
import { EvmProviderError } from '@subwallet/extension-base/background/errors/EvmProviderError';
import { withErrorLog } from '@subwallet/extension-base/background/handlers/helpers';
import { AuthUrlInfo } from '@subwallet/extension-base/background/handlers/State';
import { createSubscription, unsubscribe } from '@subwallet/extension-base/background/handlers/subscriptions';
import { AddNetworkRequestExternal, AddTokenRequestExternal, EvmAppState, EvmEventType, EvmProviderErrorType, EvmSendTransactionParams, PassPhishing, RequestAddPspToken, RequestEvmProviderSend, RequestSettingsType, ValidateNetworkResponse } from '@subwallet/extension-base/background/KoniTypes';
import RequestBytesSign from '@subwallet/extension-base/background/RequestBytesSign';
import RequestExtrinsicSign from '@subwallet/extension-base/background/RequestExtrinsicSign';
import { AccountAuthType, MessageTypes, RequestAccountList, RequestAccountSubscribe, RequestAccountUnsubscribe, RequestAuthorizeTab, RequestRpcSend, RequestRpcSubscribe, RequestRpcUnsubscribe, RequestTypes, ResponseRpcListProviders, ResponseSigning, ResponseTypes, SubscriptionMessageTypes } from '@subwallet/extension-base/background/types';
import { ALL_ACCOUNT_KEY, CRON_GET_API_MAP_STATUS } from '@subwallet/extension-base/constants';
import { PHISHING_PAGE_REDIRECT } from '@subwallet/extension-base/defaults';
import KoniState from '@subwallet/extension-base/koni/background/handlers/State';
import { _CHAIN_VALIDATION_ERROR } from '@subwallet/extension-base/services/chain-service/handler/types';
import { _NetworkUpsertParams } from '@subwallet/extension-base/services/chain-service/types';
import { _generateCustomProviderKey } from '@subwallet/extension-base/services/chain-service/utils';
import { AuthUrls } from '@subwallet/extension-base/services/request-service/types';
import { DEFAULT_CHAIN_PATROL_ENABLE } from '@subwallet/extension-base/services/setting-service/constants';
import { canDerive, getEVMChainInfo, stripUrl } from '@subwallet/extension-base/utils';
import { InjectedMetadataKnown, MetadataDef, ProviderMeta } from '@subwallet/extension-inject/types';
import { KeyringPair } from '@subwallet/keyring/types';
import keyring from '@subwallet/ui-keyring';
import { SingleAddress, SubjectInfo } from '@subwallet/ui-keyring/observable/types';
import { t } from 'i18next';
import { Subscription } from 'rxjs';
import Web3 from 'web3';
import { HttpProvider, RequestArguments, WebsocketProvider } from 'web3-core';
import { JsonRpcPayload } from 'web3-core-helpers';

import { checkIfDenied } from '@polkadot/phishing';
import { JsonRpcResponse } from '@polkadot/rpc-provider/types';
import { SignerPayloadJSON, SignerPayloadRaw } from '@polkadot/types/types';
import { assert, isNumber } from '@polkadot/util';

interface AccountSub {
  subscription: Subscription;
  url: string;
}

function transformAccountsV2 (accounts: SubjectInfo, anyType = false, authInfo?: AuthUrlInfo, accountAuthType?: AccountAuthType): InjectedAccount[] {
  const accountSelected = authInfo
    ? (
      authInfo.isAllowed
        ? (
          Object.keys(authInfo.isAllowedMap)
            .filter((address) => authInfo.isAllowedMap[address])
        )
        : []
    )
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

interface ChainPatrolResponse {
  reason: string;
  reports: Array<{ createdAt: string, id: number }>;
  status: 'UNKNOWN' | 'ALLOWED' | 'BLOCKED';
}

// check if a URL is blocked
export const chainPatrolCheckUrl = async (url: string) => {
  const response = await fetch(
    'https://app.chainpatrol.io/api/v2/asset/check',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': 'e5e88cd0-7994-4667-9071-bab849c2ba71'
      },
      body: JSON.stringify({ type: 'URL', content: url })
    }
  );
  const data = await response.json() as ChainPatrolResponse;

  return data.status === 'BLOCKED';
};

export default class KoniTabs {
  readonly #accountSubs: Record<string, AccountSub> = {};

  readonly #koniState: KoniState;

  private evmEventEmitterMap: Record<string, Record<string, (eventName: EvmEventType, payload: any) => void>> = {};
  #chainPatrolService: boolean = DEFAULT_CHAIN_PATROL_ENABLE;
  #passPhishing: Record<string, PassPhishing> = {};

  constructor (koniState: KoniState) {
    this.#koniState = koniState;

    const updateChainPatrolService = (rs: RequestSettingsType) => {
      this.#chainPatrolService = rs.enableChainPatrol;
    };

    this.#koniState.settingService.getSettings(updateChainPatrolService);
    this.#koniState.settingService.getSubject().subscribe({
      next: updateChainPatrolService
    });

    const updatePassPhishing = (rs: Record<string, PassPhishing>) => {
      this.#passPhishing = rs;
    };

    this.#koniState.settingService.getPassPhishingList(updatePassPhishing);
    this.#koniState.settingService.passPhishingSubject().subscribe({
      next: updatePassPhishing
    });
  }

  /// Clone from Polkadot.js
  private getSigningPair (address: string): KeyringPair {
    const pair = keyring.getPair(address);

    assert(pair, t('Unable to find account'));

    return pair;
  }

  private async bytesSign (url: string, request: SignerPayloadRaw): Promise<ResponseSigning> {
    const address = request.address;
    const pair = this.getSigningPair(address);
    const authInfo = await this.getAuthInfo(url);

    if (!authInfo || !authInfo.isAllowed || !authInfo.isAllowedMap[pair.address]) {
      throw new Error('Account {{address}} not in allowed list'.replace('{{address}}', address));
    }

    return this.#koniState.sign(url, new RequestBytesSign(request), { address, ...pair.meta });
  }

  private async extrinsicSign (url: string, request: SignerPayloadJSON): Promise<ResponseSigning> {
    const address = request.address;
    const pair = this.getSigningPair(address);
    const authInfo = await this.getAuthInfo(url);

    if (!authInfo || !authInfo.isAllowed || !authInfo.isAllowedMap[pair.address]) {
      throw new Error('Account {{address}} not in allowed list'.replace('{{address}}', address));
    }

    return this.#koniState.sign(url, new RequestExtrinsicSign(request), { address, ...pair.meta });
  }

  private metadataProvide (url: string, request: MetadataDef): Promise<boolean> {
    return this.#koniState.injectMetadata(url, request);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private metadataList (url: string): InjectedMetadataKnown[] {
    return this.#koniState.knownMetadata.map(({ genesisHash, specVersion }) => ({
      genesisHash,
      specVersion
    }));
  }

  private rpcListProviders (): Promise<ResponseRpcListProviders> {
    return this.#koniState.rpcListProviders();
  }

  private rpcSend (request: RequestRpcSend, port: chrome.runtime.Port): Promise<JsonRpcResponse<unknown>> {
    return this.#koniState.rpcSend(request, port);
  }

  private rpcStartProvider (key: string, port: chrome.runtime.Port): Promise<ProviderMeta> {
    return this.#koniState.rpcStartProvider(key, port);
  }

  private async rpcSubscribe (request: RequestRpcSubscribe, id: string, port: chrome.runtime.Port): Promise<boolean> {
    const innerCb = createSubscription<'pub(rpc.subscribe)'>(id, port);
    const cb = (_error: Error | null, data: SubscriptionMessageTypes['pub(rpc.subscribe)']): void => innerCb(data);
    const subscriptionId = await this.#koniState.rpcSubscribe(request, cb, port);

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
      withErrorLog(() => this.rpcUnsubscribe({ ...request, subscriptionId }, port));
    });

    return true;
  }

  private rpcSubscribeConnected (request: null, id: string, port: chrome.runtime.Port): Promise<boolean> {
    const innerCb = createSubscription<'pub(rpc.subscribeConnected)'>(id, port);
    const cb = (_error: Error | null, data: SubscriptionMessageTypes['pub(rpc.subscribeConnected)']): void => innerCb(data);

    this.#koniState.rpcSubscribeConnected(request, cb, port);

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
    });

    return Promise.resolve(true);
  }

  private async rpcUnsubscribe (request: RequestRpcUnsubscribe, port: chrome.runtime.Port): Promise<boolean> {
    return this.#koniState.rpcUnsubscribe(request, port);
  }

  private redirectPhishingLanding (phishingWebsite: string): void {
    const nonFragment = phishingWebsite.split('#')[0];
    const encodedWebsite = encodeURIComponent(nonFragment);
    const url = `${chrome.runtime.getURL('index.html')}#${PHISHING_PAGE_REDIRECT}/${encodedWebsite}`;

    chrome.tabs.query({ url: nonFragment }, (tabs) => {
      tabs
        .map(({ id }) => id)
        .filter((id): id is number => isNumber(id))
        .forEach((id) =>
          withErrorLog(() => chrome.tabs.update(id, { url }))
        );
    });
  }

  private checkPassList (_url: string): boolean {
    const url = stripUrl(_url);

    const result = this.#passPhishing[url];

    return result ? !result.pass : true;
  }

  protected async checkPhishing (url: string): Promise<boolean> {
    const isInDenyList = await checkIfDenied(url);

    if (isInDenyList) {
      return this.checkPassList(url);
    }

    if (this.#chainPatrolService) {
      const isInChainPatrolDenyList = await chainPatrolCheckUrl(url);

      if (isInChainPatrolDenyList) {
        return this.checkPassList(url);
      }
    }

    return false;
  }

  protected async redirectIfPhishing (url: string): Promise<boolean> {
    const result = await this.checkPhishing(url);

    if (result) {
      this.redirectPhishingLanding(url);
    }

    return result;
  }

  ///

  private cancelSubscription (id: string): boolean {
    return this.#koniState.cancelSubscription(id);
  }

  private createUnsubscriptionHandle (id: string, unsubscribe: () => void): void {
    this.#koniState.createUnsubscriptionHandle(id, unsubscribe);
  }

  async getAuthInfo (url: string, fromList?: AuthUrls): Promise<AuthUrlInfo | undefined> {
    const authList = fromList || (await this.#koniState.getAuthList());
    const shortenUrl = stripUrl(url);

    return authList[shortenUrl];
  }

  private async accountsListV2 (url: string, { accountAuthType,
    anyType }: RequestAccountList): Promise<InjectedAccount[]> {
    const authInfo = await this.getAuthInfo(url);

    return transformAccountsV2(this.#koniState.keyringService.accounts, anyType, authInfo, authInfo?.accountAuthType || accountAuthType);
  }

  private accountsSubscribeV2 (url: string, { accountAuthType }: RequestAccountSubscribe, id: string, port: chrome.runtime.Port): string {
    const cb = createSubscription<'pub(accounts.subscribeV2)'>(id, port);
    const authInfoSubject = this.#koniState.requestService.subscribeAuthorizeUrlSubject;

    // Update unsubscribe from @polkadot/extension-base
    this.#accountSubs[id] = {
      subscription: authInfoSubject.subscribe((infos: AuthUrls) => {
        this.getAuthInfo(url, infos)
          .then((authInfo) => {
            const accountAuthType_ = authInfo?.accountAuthType || accountAuthType;
            const accounts = this.#koniState.keyringService.accounts;

            return cb(transformAccountsV2(accounts, false, authInfo, accountAuthType_));
          })
          .catch(console.error);
      }),
      url
    };

    port.onDisconnect.addListener((): void => {
      this.accountsUnsubscribe(url, { id });
    });

    return id;
  }

  private accountsUnsubscribe (url: string, { id }: RequestAccountUnsubscribe): boolean {
    const sub = this.#accountSubs[id];

    if (!sub || sub.url !== url) {
      return false;
    }

    delete this.#accountSubs[id];

    unsubscribe(id);
    sub.subscription.unsubscribe();

    return true;
  }

  private authorizeV2 (url: string, request: RequestAuthorizeTab): Promise<boolean> {
    if (request.accountAuthType === 'evm') {
      return new Promise((resolve, reject) => {
        this.#koniState.authorizeUrlV2(url, request).then(resolve).catch((e: Error) => {
          reject(new EvmProviderError(EvmProviderErrorType.USER_REJECTED_REQUEST));
        });
      });
    } else {
      return this.#koniState.authorizeUrlV2(url, request);
    }
  }

  private async getEvmCurrentAccount (url: string): Promise<string[]> {
    return await new Promise((resolve) => {
      this.getAuthInfo(url).then((authInfo) => {
        const allAccounts = this.#koniState.keyringService.accounts;
        const accountList = transformAccountsV2(allAccounts, false, authInfo, 'evm').map((a) => a.address);
        let accounts: string[] = [];

        const address = this.#koniState.keyringService.currentAccount.address;

        if (address === ALL_ACCOUNT_KEY || !address) {
          accounts = accountList;
        } else {
          if (accountList.includes(address)) {
            const result = accountList.filter((adr) => adr !== address);

            result.unshift(address);
            accounts = result;
          } else {
            accounts = accountList;
          }
        }

        resolve(accounts);
      }).catch(console.error);
    });
  }

  private async getEvmState (url?: string): Promise<EvmAppState> {
    let currentChain: string | undefined;
    let autoActiveChain = false;

    if (url) {
      const authInfo = await this.getAuthInfo(url);

      if (authInfo?.currentEvmNetworkKey) {
        currentChain = authInfo?.currentEvmNetworkKey;
      }

      if (authInfo?.isAllowed) {
        autoActiveChain = true;
      }
    }

    const currentEvmNetwork = this.#koniState.requestService.getDAppChainInfo({
      autoActive: autoActiveChain,
      accessType: 'evm',
      defaultChain: currentChain,
      url
    });

    if (currentEvmNetwork) {
      const { evmInfo, slug } = currentEvmNetwork;
      const evmApi = this.#koniState.getEvmApi(slug);
      const web3 = evmApi?.api;

      if (web3?.currentProvider instanceof Web3.providers.WebsocketProvider) {
        if (!web3.currentProvider.connected) {
          console.log(`${slug} is disconnected, trying to connect...`);
          this.#koniState.refreshWeb3Api(slug);
          let checkingNum = 0;

          const poll = (resolve: (value: unknown) => void) => {
            checkingNum += 1;

            if ((web3.currentProvider as WebsocketProvider).connected) {
              console.log(`${slug} is connected.`);
              resolve(true);
            } else {
              console.log(`Connecting to network [${slug}]`);

              if (checkingNum < 10) {
                setTimeout(() => poll(resolve), 900);
              } else {
                console.log(`Max retry, stop checking [${slug}]`);
                resolve(false);
              }
            }
          };

          await new Promise(poll);
        }
      }

      return {
        networkKey: slug,
        chainId: `0x${(evmInfo?.evmChainId || 0).toString(16)}`,
        web3
      };
    } else {
      return {};
    }
  }

  private async getEvmPermission (url: string, id: string) {
    const accounts = await this.getEvmCurrentAccount(url);

    return [{
      id: id,
      invoker: url,
      parentCapability: 'eth_accounts',
      caveats: [{ type: 'restrictReturnedAccounts', value: accounts }],
      date: new Date().getTime()
    }];
  }

  private async switchEvmChain (id: string, url: string, { params }: RequestArguments) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const chainId = params[0].chainId as string;
    const chainIdDec = parseInt(chainId, 16);

    const evmState = await this.getEvmState(url);

    if (evmState.chainId === chainId) {
      return null;
    }

    const [networkKey] = this.#koniState.findNetworkKeyByChainId(chainIdDec);

    if (networkKey) {
      await this.#koniState.switchEvmNetworkByUrl(stripUrl(url), networkKey);
    } else {
      const onlineData = await getEVMChainInfo(chainIdDec);

      if (onlineData) {
        const chainData: AddNetworkRequestExternal = {
          chainId: chainId,
          rpcUrls: onlineData.rpc.filter((url) => (url.startsWith('https://'))),
          chainName: onlineData.name,
          blockExplorerUrls: onlineData.explorers.map((explorer) => explorer.url),
          nativeCurrency: onlineData.nativeCurrency,
          requestId: id
        };

        await this.addEvmChain(id, url, { method: 'wallet_addEthereumChain', params: [chainData] });
      } else {
        throw new EvmProviderError(EvmProviderErrorType.INVALID_PARAMS, 'This network is currently not supported');
      }
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

    const _tokenType = input?.type?.toLowerCase() || '';

    if (_tokenType !== 'erc20' && _tokenType !== 'erc721') {
      throw new EvmProviderError(EvmProviderErrorType.INVALID_PARAMS, 'Assets type {{tokenType}} is not supported'.replace('{{tokenType}}', _tokenType));
    }

    if (!input?.options?.address || !input?.options?.symbol) {
      throw new EvmProviderError(EvmProviderErrorType.INVALID_PARAMS, 'Unable to get contract address and token symbol');
    }

    const evmState = await this.getEvmState(url);
    const chain = evmState.networkKey;

    if (!chain) {
      throw new EvmProviderError(EvmProviderErrorType.INTERNAL_ERROR, 'The network on dApp is not supported in wallet. Please manually add the network to wallet');
    }

    const tokenType = _tokenType === 'erc20' ? _AssetType.ERC20 : _AssetType.ERC721;

    const tokenInfo: AddTokenRequestExternal = {
      slug: '',
      type: tokenType,
      name: input?.options?.symbol || '',
      contractAddress: input.options.address,
      symbol: input?.options?.symbol || '',
      decimals: input?.options?.decimals || 0,
      originChain: chain,
      contractError: false,
      validated: false
    };

    this.#koniState.validateCustomAsset({
      type: tokenType,
      contractAddress: input.options.address,
      originChain: chain
    })
      .then((validate) => {
        if (validate.contractError) {
          tokenInfo.contractError = true;
        } else {
          tokenInfo.slug = validate?.existedSlug;
          tokenInfo.name = validate.name || tokenInfo.name;
          tokenInfo.symbol = validate.symbol;
          tokenInfo.decimals = validate.decimals;
        }
      })
      .catch(() => {
        tokenInfo.contractError = true;
      })
      .finally(() => {
        tokenInfo.validated = true;

        this.#koniState.requestService.updateConfirmation(id, 'addTokenRequest', tokenInfo);
      });

    // Below code is comment because we will handle exited token in the ui-view
    // if (validate.isExist) {
    //   throw new EvmProviderError(EvmProviderErrorType.INTERNAL_ERROR, 'Current token is existed');
    // } else

    return await this.#koniState.addTokenConfirm(id, url, tokenInfo);
  }

  private async addEvmChain (id: string, url: string, { params }: RequestArguments) {
    const input = params as AddNetworkRequestExternal[];

    if (input && input.length > 0) {
      const { blockExplorerUrls, chainId, chainName, nativeCurrency: { decimals, symbol }, rpcUrls } = input[0];

      if (chainId) {
        const chainIdNum = parseInt(chainId, 16);
        const [existedNetworkSlug, existedChainInfo] = this.#koniState.findNetworkKeyByChainId(chainIdNum);

        if (existedNetworkSlug && existedChainInfo && existedChainInfo?.evmInfo) {
          return await this.switchEvmChain(id, url, { method: 'wallet_switchEthereumChain', params: [{ chainId }] });
          // const evmInfo = existedChainInfo.evmInfo;
          // const substrateInfo = existedChainInfo.substrateInfo;
          // const chainState = this.#koniState.getChainStateByKey(existedNetworkSlug);
          //
          // return await this.#koniState.addNetworkConfirm(id, url, {
          //   mode: 'update',
          //   chainSpec: {
          //     evmChainId: evmInfo.evmChainId,
          //     decimals: evmInfo.decimals,
          //     existentialDeposit: evmInfo.existentialDeposit,
          //     genesisHash: substrateInfo?.genesisHash || '',
          //     paraId: substrateInfo?.paraId || null,
          //     addressPrefix: substrateInfo?.addressPrefix || 0
          //   },
          //   chainEditInfo: {
          //     blockExplorer: blockExplorerUrls?.[0],
          //     slug: existedNetworkSlug,
          //     currentProvider: chainState.currentProvider,
          //     providers: existedChainInfo.providers,
          //     symbol: evmInfo.symbol,
          //     chainType: 'EVM',
          //     name: existedChainInfo.name
          //   }
          // });
        } else if (rpcUrls && chainName) {
          const filteredUrls = rpcUrls.filter((targetString) => {
            let url;

            try {
              url = new URL(targetString);
            } catch (_) {
              return false;
            }

            return url.protocol === 'http:' || url.protocol === 'https:';
          });

          if (!filteredUrls.length) {
            throw new EvmProviderError(EvmProviderErrorType.INTERNAL_ERROR, 'Currently support WSS provider for Substrate networks and HTTP provider for EVM network');
          }

          const provider = filteredUrls[0];

          const chainInfo: ValidateNetworkResponse = {
            existentialDeposit: '0',
            genesisHash: '',
            success: true,
            addressPrefix: '',
            evmChainId: chainIdNum,
            decimals: decimals,
            symbol: symbol,
            paraId: null,
            name: chainName
          };

          const newProviderKey = _generateCustomProviderKey(0);

          const networkData: _NetworkUpsertParams = {
            mode: 'insert',
            chainSpec: {
              evmChainId: chainInfo.evmChainId,
              decimals: chainInfo.decimals,
              existentialDeposit: chainInfo.existentialDeposit,
              genesisHash: chainInfo.genesisHash,
              paraId: chainInfo.paraId,
              addressPrefix: chainInfo.addressPrefix ? parseInt(chainInfo.addressPrefix) : 0
            },
            chainEditInfo: {
              blockExplorer: blockExplorerUrls?.[0],
              slug: '',
              currentProvider: newProviderKey,
              providers: { [newProviderKey]: provider },
              symbol: chainInfo.symbol,
              chainType: 'EVM',
              name: chainInfo.name
            },
            unconfirmed: true
          };

          this.#koniState.validateCustomChain(provider).then((res) => {
            if (!res.success) {
              networkData.providerError = res.error;
            } else {
              networkData.chainSpec = {
                evmChainId: res.evmChainId,
                decimals: res.decimals,
                existentialDeposit: res.existentialDeposit,
                genesisHash: res.genesisHash,
                paraId: res.paraId,
                addressPrefix: res.addressPrefix ? parseInt(res.addressPrefix) : 0
              };

              networkData.chainEditInfo.symbol = res.symbol;
              networkData.chainEditInfo.name = res.name;
            }
          }).catch(() => {
            networkData.providerError = _CHAIN_VALIDATION_ERROR.NONE;
          }).finally(() => {
            networkData.unconfirmed = false;
            this.#koniState.requestService.updateConfirmation(id, 'addNetworkRequest', networkData);
          });

          return await this.#koniState.addNetworkConfirm(id, url, networkData);
        } else {
          throw new EvmProviderError(EvmProviderErrorType.INVALID_PARAMS, 'Invalid provider');
        }
      }
    }

    return null;
  }

  private async getEvmCurrentChainId (url: string): Promise<string> {
    const evmState = await this.getEvmState(url);

    return evmState.chainId || '0x0';
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

    const accountListSubscription = this.#koniState.keyringService.currentAccountSubject
      .subscribe(() => {
        onCurrentAccountChanged().catch(console.error);
      });

    // Detect network chain
    const evmState = await this.getEvmState(url);
    let currentChainId = evmState.chainId;

    const _onAuthChanged = async () => {
      // Detect network
      const { chainId } = await this.getEvmState(url);

      if (chainId !== currentChainId) {
        emitEvent('chainChanged', chainId);
        currentChainId = chainId;
      }

      // Detect account
      const newAccountList = await this.getEvmCurrentAccount(url);

      // Compare to void looping reload
      if (JSON.stringify(currentAccountList) !== JSON.stringify(newAccountList)) {
        // eslint-disable-next-line node/no-callback-literal
        emitEvent('accountsChanged', newAccountList);
        currentAccountList = newAccountList;
      }
    };

    const authUrlSubscription = this.#koniState.subscribeEvmChainChange()
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
              emitEvent('disconnect', new EvmProviderError(EvmProviderErrorType.CHAIN_DISCONNECTED));
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
      provider?.on && provider?.on(event, callback);
    });

    // Add event emitter
    if (!this.evmEventEmitterMap[url]) {
      this.evmEventEmitterMap[url] = {};
    }

    this.evmEventEmitterMap[url][id] = emitEvent;

    this.createUnsubscriptionHandle(id, () => {
      if (this.evmEventEmitterMap[url][id]) {
        delete this.evmEventEmitterMap[url][id];
      }

      Object.entries(eventMap).forEach(([event, callback]) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        provider?.removeListener && provider?.removeListener(event, callback);
      });
      accountListSubscription.unsubscribe();
      authUrlSubscription.unsubscribe();
      clearInterval(networkCheckInterval);
    });

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return true;
  }

  private checkAndHandleProviderStatus (provider: WebsocketProvider | HttpProvider | undefined) {
    if ((!provider || !provider?.connected) && provider?.supportsSubscriptions()) { // excludes HttpProvider
      Object.values(this.evmEventEmitterMap).forEach((m) => {
        Object.values(m).forEach((emitter) => {
          emitter('disconnect', new EvmProviderError(EvmProviderErrorType.CHAIN_DISCONNECTED));
        });
      });
      throw new EvmProviderError(EvmProviderErrorType.CHAIN_DISCONNECTED);
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

  private async performWeb3Method (id: string, url: string, { method,
    params }: RequestArguments, callback?: (result?: any) => void) {
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
    const allowedAccounts = await this.getEvmCurrentAccount(url);

    return !!allowedAccounts.find((acc) => (acc.toLowerCase() === address.toLowerCase()));
  }

  private async evmSign (id: string, url: string, { method, params }: RequestArguments) {
    const allowedAccounts = (await this.getEvmCurrentAccount(url));
    const signResult = await this.#koniState.evmSign(id, url, method, params, allowedAccounts);

    if (signResult) {
      return signResult;
    } else {
      throw new EvmProviderError(EvmProviderErrorType.INVALID_PARAMS, 'Failed to sign message');
    }
  }

  public async evmSendTransaction (id: string, url: string, { params }: RequestArguments) {
    const transactionParams = (params as EvmSendTransactionParams[])[0];
    const canUseAccount = transactionParams.from && this.canUseAccount(transactionParams.from, url);
    const evmState = await this.getEvmState(url);
    const networkKey = evmState.networkKey;

    if (!canUseAccount) {
      throw new Error(t('You have rescinded allowance for this account in wallet'));
    }

    if (!networkKey) {
      throw new Error('Network unavailable. Please switch network or manually add network to wallet');
    }

    const allowedAccounts = await this.getEvmCurrentAccount(url);
    const transactionHash = await this.#koniState.evmSendTransaction(id, url, networkKey, allowedAccounts, transactionParams);

    if (!transactionHash) {
      throw new EvmProviderError(EvmProviderErrorType.USER_REJECTED_REQUEST);
    }

    return transactionHash;
  }

  private async handleEvmRequest (id: string, url: string, request: RequestArguments): Promise<unknown> {
    const { method } = request;

    try {
      switch (method) {
        case 'eth_chainId':
          return await this.getEvmCurrentChainId(url);
        case 'net_version':
          return parseInt(await this.getEvmCurrentChainId(url), 16);
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
        console.error(e);
        throw new EvmProviderError(EvmProviderErrorType.INTERNAL_ERROR, e?.toString());
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

      this.cancelSubscription(id);
    });

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return true;
  }

  public isEvmPublicRequest (type: string, request: RequestArguments) {
    return type === 'evm(request)' &&
      [
        'eth_chainId',
        'net_version'
      ].includes(request?.method);
  }

  public async addPspToken (id: string, url: string, { genesisHash, tokenInfo: input }: RequestAddPspToken) {
    const _tokenType = input.type;

    if (_tokenType !== 'psp22' && _tokenType !== 'psp34') {
      throw new EvmProviderError(EvmProviderErrorType.INVALID_PARAMS, 'Assets type {{tokenType}} is not supported'.replace('{{tokenType}}', _tokenType));
    }

    if (!input.address || !input.symbol) {
      throw new EvmProviderError(EvmProviderErrorType.INVALID_PARAMS, 'Unable to get contract address and token symbol');
    }

    const [chain] = this.#koniState.findNetworkKeyByGenesisHash(genesisHash);

    if (!chain) {
      throw new EvmProviderError(EvmProviderErrorType.INTERNAL_ERROR, 'The network on dApp is not supported in wallet. Please manually add the network to wallet');
    }

    const state = this.#koniState.getChainStateByKey(chain);

    if (!state.active) {
      await this.#koniState.enableChain(chain, false);
      const api = this.#koniState.getSubstrateApi(chain);

      await api.isReady;
    }

    const tokenType = _tokenType === 'psp22' ? _AssetType.PSP22 : _AssetType.PSP34;

    const tokenInfo: AddTokenRequestExternal = {
      slug: '',
      type: tokenType,
      name: input.symbol || '',
      contractAddress: input.address,
      symbol: input.symbol || '',
      decimals: input.decimals || 0,
      originChain: chain,
      contractError: false,
      validated: false
    };

    this.#koniState.validateCustomAsset({
      type: tokenType,
      contractAddress: input.address,
      originChain: chain
    })
      .then((validate) => {
        if (validate.contractError) {
          tokenInfo.contractError = true;
        } else {
          tokenInfo.slug = validate?.existedSlug;
          tokenInfo.name = validate.name || tokenInfo.name;
          tokenInfo.symbol = validate.symbol;
          tokenInfo.decimals = validate.decimals;
        }
      })
      .catch(() => {
        tokenInfo.contractError = true;
      })
      .finally(() => {
        tokenInfo.validated = true;

        this.#koniState.requestService.updateConfirmation(id, 'addTokenRequest', tokenInfo);
      });

    return await this.#koniState.addTokenConfirm(id, url, tokenInfo);
  }

  public async handle<TMessageType extends MessageTypes> (id: string, type: TMessageType, request: RequestTypes[TMessageType], url: string, port: chrome.runtime.Port): Promise<ResponseTypes[keyof ResponseTypes]> {
    if (type === 'pub(phishing.redirectIfDenied)') {
      return this.redirectIfPhishing(url);
    }

    if (type === 'pub(ping)') {
      return Promise.resolve(true);
    }

    // Wait for account ready and chain ready
    await Promise.all([this.#koniState.eventService.waitAccountReady, this.#koniState.eventService.waitChainReady]);

    if (type !== 'pub(authorize.tabV2)' && !this.isEvmPublicRequest(type, request as RequestArguments)) {
      await this.#koniState.ensureUrlAuthorizedV2(url)
        .catch((e: Error) => {
          if (type.startsWith('evm')) {
            throw new EvmProviderError(EvmProviderErrorType.INTERNAL_ERROR, e.message);
          } else {
            throw e;
          }
        });
    }

    switch (type) {
      /// Clone from PolkadotJs
      case 'pub(bytes.sign)':
        return this.bytesSign(url, request as SignerPayloadRaw);

      case 'pub(extrinsic.sign)':
        return this.extrinsicSign(url, request as SignerPayloadJSON);

      case 'pub(metadata.list)':
        return this.metadataList(url);

      case 'pub(metadata.provide)':
        return this.metadataProvide(url, request as MetadataDef);

      case 'pub(rpc.listProviders)':
        return this.rpcListProviders();

      case 'pub(rpc.send)':
        return this.rpcSend(request as RequestRpcSend, port);

      case 'pub(rpc.startProvider)':
        return this.rpcStartProvider(request as string, port);

      case 'pub(rpc.subscribe)':
        return this.rpcSubscribe(request as RequestRpcSubscribe, id, port);

      case 'pub(rpc.subscribeConnected)':
        return this.rpcSubscribeConnected(request as null, id, port);

      case 'pub(rpc.unsubscribe)':
        return this.rpcUnsubscribe(request as RequestRpcUnsubscribe, port);

      case 'pub(token.add)':
        return this.addPspToken(id, url, request as RequestAddPspToken);

      ///
      case 'pub(authorize.tabV2)':
        return this.authorizeV2(url, request as RequestAuthorizeTab);
      case 'pub(accounts.listV2)':
        return this.accountsListV2(url, request as RequestAccountList);
      case 'pub(accounts.subscribeV2)':
        return this.accountsSubscribeV2(url, request as RequestAccountSubscribe, id, port);
      case 'pub(accounts.unsubscribe)':
        return this.accountsUnsubscribe(url, request as RequestAccountUnsubscribe);
      case 'evm(events.subscribe)':
        return await this.evmSubscribeEvents(url, id, port);
      case 'evm(request)':
        return await this.handleEvmRequest(id, url, request as RequestArguments);
      case 'evm(provider.send)':
        return await this.handleEvmSend(id, url, port, request as RequestEvmProviderSend);
      default:
        throw new Error(`Unable to handle message of type ${type}`);
    }
  }
}
