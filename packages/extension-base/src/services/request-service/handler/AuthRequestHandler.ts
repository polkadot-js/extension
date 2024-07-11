// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { AuthRequestV2, ResultResolver } from '@subwallet/extension-base/background/KoniTypes';
import { AccountAuthType, AuthorizeRequest, RequestAuthorizeTab, Resolver } from '@subwallet/extension-base/background/types';
import { ChainService } from '@subwallet/extension-base/services/chain-service';
import { _isChainEvmCompatible } from '@subwallet/extension-base/services/chain-service/utils';
import { KeyringService } from '@subwallet/extension-base/services/keyring-service';
import RequestService from '@subwallet/extension-base/services/request-service';
import { DAPP_CONNECT_ALL_TYPE_ACCOUNT_URL, PREDEFINED_CHAIN_DAPP_CHAIN_MAP, WEB_APP_URL } from '@subwallet/extension-base/services/request-service/constants';
import { AuthUrls } from '@subwallet/extension-base/services/request-service/types';
import AuthorizeStore from '@subwallet/extension-base/stores/Authorize';
import { createPromiseHandler, getDomainFromUrl, PromiseHandler, stripUrl } from '@subwallet/extension-base/utils';
import { getId } from '@subwallet/extension-base/utils/getId';
import { BehaviorSubject } from 'rxjs';

import { isEthereumAddress } from '@polkadot/util-crypto';

const AUTH_URLS_KEY = 'authUrls';

export default class AuthRequestHandler {
  readonly #requestService: RequestService;
  readonly #chainService: ChainService;
  private readonly authorizeStore = new AuthorizeStore();
  readonly #authRequestsV2: Record<string, AuthRequestV2> = {};
  private authorizeCached: AuthUrls | undefined = undefined;
  private readonly authorizeUrlSubject = new BehaviorSubject<AuthUrls>({});
  private readonly evmChainSubject = new BehaviorSubject<AuthUrls>({});
  public readonly authSubjectV2: BehaviorSubject<AuthorizeRequest[]> = new BehaviorSubject<AuthorizeRequest[]>([]);

  constructor (requestService: RequestService, chainService: ChainService, private keyringService: KeyringService) {
    this.#requestService = requestService;
    this.#chainService = chainService;

    this.init().catch(console.error);
  }

  private async init () {
    const authList = await this.getAuthList();
    let needUpdateAuthList = false;

    Object.entries(authList).forEach(([key, value]) => {
      const existKeyAllBothConnect = DAPP_CONNECT_ALL_TYPE_ACCOUNT_URL.find((url_) => url_.includes(key));

      if (existKeyAllBothConnect && value.accountAuthType !== 'both') {
        needUpdateAuthList = true;
        authList[key] = {
          ...value,
          accountAuthType: 'both'
        };
      }
    });

    if (needUpdateAuthList) {
      this.setAuthorize(authList);
    }
  }

  private getAddressList (value = false): Record<string, boolean> {
    const addressList = Object.keys(this.keyringService.accounts);

    return addressList.reduce((addressList, v) => ({ ...addressList, [v]: value }), {});
  }

  public get numAuthRequestsV2 (): number {
    return Object.keys(this.#authRequestsV2).length;
  }

  private get allAuthRequestsV2 (): AuthorizeRequest[] {
    return Object
      .values(this.#authRequestsV2)
      .map(({ id, request, url }): AuthorizeRequest => ({ id, request, url }));
  }

  private updateIconAuthV2 (shouldClose?: boolean): void {
    this.authSubjectV2.next(this.allAuthRequestsV2);
    this.#requestService.updateIconV2(shouldClose);
  }

  public setAuthorize (data: AuthUrls, callback?: () => void): void {
    this.authorizeStore.set(AUTH_URLS_KEY, data, () => {
      this.authorizeCached = data;
      this.evmChainSubject.next(this.authorizeCached);
      this.authorizeUrlSubject.next(this.authorizeCached);
      callback && callback();
    });
  }

  public getAuthorize (update: (value: AuthUrls) => void): void {
    // This action can be use many by DApp interaction => caching it in memory
    if (this.authorizeCached) {
      update(this.authorizeCached);
    } else {
      this.authorizeStore.get('authUrls', (data) => {
        this.authorizeCached = data || {};
        this.evmChainSubject.next(this.authorizeCached);
        this.authorizeUrlSubject.next(this.authorizeCached);
        update(this.authorizeCached);
      });
    }
  }

  public getAuthList (): Promise<AuthUrls> {
    return new Promise<AuthUrls>((resolve, reject) => {
      this.getAuthorize((rs: AuthUrls) => {
        resolve(rs);
      });
    });
  }

  public getDAppChainInfo (options: {accessType: AccountAuthType, autoActive?: boolean, defaultChain?: string, url?: string}): _ChainInfo | undefined {
    const chainInfoMaps = this.#chainService.getChainInfoMap();
    const chainStateMap = this.#chainService.getChainStateMap();
    let defaultChain = options.defaultChain;
    let needEnableChains: string[] = [];

    if (options.url) {
      const domain = getDomainFromUrl(options.url);
      const predefinedSupportChains = PREDEFINED_CHAIN_DAPP_CHAIN_MAP[domain];

      if (!defaultChain && predefinedSupportChains) {
        defaultChain = predefinedSupportChains[0];
        options.autoActive && needEnableChains.push(...predefinedSupportChains);
      }
    }

    let chainInfo: _ChainInfo | undefined;

    if (['both', 'evm'].includes(options.accessType)) {
      const evmChains = Object.values(chainInfoMaps).filter(_isChainEvmCompatible);

      chainInfo = (defaultChain ? chainInfoMaps[defaultChain] : evmChains.find((chain) => chainStateMap[chain.slug]?.active)) || evmChains[0];

      if (options.autoActive) {
        if (!needEnableChains.includes(chainInfo?.slug)) {
          needEnableChains.push(chainInfo?.slug);
        }
      }
    }

    needEnableChains = needEnableChains.filter((slug) => !chainStateMap[slug]?.active);
    needEnableChains.length > 0 && this.#chainService.enableChains(needEnableChains);

    return chainInfo;
  }

  private authCompleteV2 = (id: string, url: string, resolve: (result: boolean) => void, reject: (error: Error) => void): Resolver<ResultResolver> => {
    const isAllowedMap = this.getAddressList();

    const complete = (result: boolean | Error, cb: () => void, accounts?: string[]) => {
      const isAllowed = result === true;
      let isCancelled = false;

      if (!isAllowed && typeof result === 'object' && result.message === 'Cancelled') {
        isCancelled = true;
      }

      if (accounts && accounts.length) {
        accounts.forEach((acc) => {
          isAllowedMap[acc] = true;
        });
      } else {
        // eslint-disable-next-line no-return-assign
        Object.keys(isAllowedMap).forEach((address) => isAllowedMap[address] = false);
      }

      const { accountAuthType, idStr, request: { allowedAccounts, origin }, url } = this.#authRequestsV2[id];

      if (accountAuthType !== 'both') {
        const isEvmType = accountAuthType === 'evm';

        const backupAllowed = [...(allowedAccounts || [])].filter((a) => {
          const isEth = isEthereumAddress(a);

          return isEvmType ? !isEth : isEth;
        });

        backupAllowed.forEach((acc) => {
          isAllowedMap[acc] = true;
        });
      }

      const defaultEvmNetworkKey = this.getDAppChainInfo({ accessType: accountAuthType, url, autoActive: !isCancelled && isAllowed })?.slug;

      this.getAuthorize((value) => {
        let authorizeList = {} as AuthUrls;

        if (value) {
          authorizeList = value;
        }

        const existed = authorizeList[stripUrl(url)];

        // On cancel don't save anything
        if (isCancelled) {
          delete this.#authRequestsV2[id];
          this.updateIconAuthV2(true);
          cb();

          return;
        }

        authorizeList[stripUrl(url)] = {
          count: 0,
          id: idStr,
          isAllowed,
          isAllowedMap,
          origin,
          url,
          accountAuthType: (existed && existed.accountAuthType !== accountAuthType) ? 'both' : accountAuthType,
          currentEvmNetworkKey: existed ? existed.currentEvmNetworkKey : defaultEvmNetworkKey
        };

        this.setAuthorize(authorizeList, () => {
          cb();
          delete this.#authRequestsV2[id];
          this.updateIconAuthV2(true);
        });
      });
    };

    return {
      reject: (error: Error): void => {
        complete(error, () => {
          reject(error);
        });
      },
      resolve: ({ accounts, result }: ResultResolver): void => {
        complete(result, () => {
          resolve(result);
        }, accounts);
      }
    };
  };

  private authorizePromiseMap: Record<string, PromiseHandler<boolean>> = {};
  public async authorizeUrlV2 (url: string, request: RequestAuthorizeTab): Promise<boolean> {
    let authList = await this.getAuthList();
    const idStr = stripUrl(url);
    const isAllowedDappConnectAllType = !!DAPP_CONNECT_ALL_TYPE_ACCOUNT_URL.find((url_) => url.includes(url_));
    let accountAuthType = isAllowedDappConnectAllType ? 'both' : (request.accountAuthType || 'substrate');

    request.accountAuthType = accountAuthType;

    if (!authList) {
      authList = {};
    }

    const id = getId();
    const promiseHandler = createPromiseHandler<boolean>();
    const { promise, reject, resolve } = promiseHandler;
    const isExistedAuthBothBefore = Object.entries(this.authorizeUrlSubject.value)
      .find(([key, data]) =>
        (key === idStr && data.accountAuthType === 'both'));

    if (isExistedAuthBothBefore) {
      return true;
    }

    // Add promise to the map
    this.authorizePromiseMap[id] = promiseHandler;
    // Remove promise from the map after finish
    promise.finally(() => {
      delete this.authorizePromiseMap[id];
    });

    // Do not enqueue duplicate authorization requests.
    const mergeKeys: string[] = [];

    Object.entries(this.#authRequestsV2)
      .forEach(([key, _request]) => {
        if (_request.idStr === idStr) {
          if (_request.accountAuthType !== request.accountAuthType) {
            request.accountAuthType = 'both';
            accountAuthType = 'both';
          }

          mergeKeys.push(key);
        }
      });

    // Resolve with current promise
    if (mergeKeys.length > 0) {
      mergeKeys.forEach((key) => {
        delete this.#authRequestsV2[key];
        const backupHandler = this.authorizePromiseMap[key];

        promise.then(backupHandler.resolve).catch(backupHandler.reject);
      });
    }

    const existedAuth = authList[idStr];
    const existedAccountAuthType = existedAuth?.accountAuthType;
    const confirmAnotherType = existedAccountAuthType !== 'both' && existedAccountAuthType !== request.accountAuthType;

    if (request.reConfirm && existedAuth) {
      request.origin = existedAuth.origin;
    }

    // Reconfirm if check auth for empty list
    if (existedAuth) {
      const inBlackList = existedAuth && !existedAuth.isAllowed;

      if (inBlackList) {
        throw new Error('The source {{url}} is not allowed to interact with this extension'.replace('{{url}}', url));
      }

      request.allowedAccounts = Object.entries(existedAuth.isAllowedMap)
        .map(([address, allowed]) => (allowed ? address : ''))
        .filter((item) => (item !== ''));

      let allowedListByRequestType = [...request.allowedAccounts];

      if (accountAuthType === 'evm') {
        allowedListByRequestType = allowedListByRequestType.filter((a) => isEthereumAddress(a));
      } else if (accountAuthType === 'substrate') {
        allowedListByRequestType = allowedListByRequestType.filter((a) => !isEthereumAddress(a));
      }

      if (!confirmAnotherType && !request.reConfirm && allowedListByRequestType.length !== 0) {
        // Prevent appear confirmation popup
        return false;
      }
    } else {
      // Auto auth for web app

      // Ignore white list
      const isWhiteList = WEB_APP_URL.some((url) => idStr.includes(url)) && false;

      if (isWhiteList) {
        const isAllowedMap = this.getAddressList(true);

        authList[stripUrl(url)] = {
          count: 0,
          id: idStr,
          isAllowed: true,
          isAllowedMap,
          origin,
          url,
          accountAuthType: 'both'
        };

        this.setAuthorize(authList);

        return true;
      }
    }

    this.#authRequestsV2[id] = {
      ...this.authCompleteV2(id, url, resolve, reject),
      id,
      idStr,
      request,
      url,
      accountAuthType: accountAuthType
    };

    this.updateIconAuthV2();

    if (Object.keys(this.#authRequestsV2).length < 2 && !(mergeKeys.length > 0 && mergeKeys[mergeKeys.length - 1] !== id)) {
      this.#requestService.popupOpen();
    }

    return promise;
  }

  public getAuthRequestV2 (id: string): AuthRequestV2 {
    return this.#authRequestsV2[id];
  }

  public get subscribeEvmChainChange () {
    return this.evmChainSubject;
  }

  public get subscribeAuthorizeUrlSubject () {
    return this.authorizeUrlSubject;
  }

  public ensureUrlAuthorizedV2 (url: string): Promise<boolean> {
    const idStr = stripUrl(url);

    return new Promise((resolve, reject) => {
      this.getAuthorize((value) => {
        if (!value) {
          value = {};
        }

        const entry = Object.keys(value).includes(idStr);

        if (!entry) {
          reject(new Error('The source {{url}} has not been authorized yet'.replace('{{url}}', url)));
        }

        const isConnected = value[idStr] && Object.keys(value[idStr].isAllowedMap)
          .some((address) => value[idStr].isAllowedMap[address]);

        if (!isConnected) {
          reject(new Error('The source {{url}} is not allowed to interact with this extension'.replace('{{url}}', url)));
        }

        resolve(true);
      });
    });
  }

  public resetWallet () {
    for (const request of Object.values(this.#authRequestsV2)) {
      request.reject(new Error('Reset wallet'));
    }

    this.authSubjectV2.next([]);
    this.setAuthorize({});
  }
}
