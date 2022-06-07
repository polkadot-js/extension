// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { InjectedAccount } from '@subwallet/extension-inject/types';

import { AuthUrls } from '@subwallet/extension-base/background/handlers/State';
import { createSubscription, unsubscribe } from '@subwallet/extension-base/background/handlers/subscriptions';
import Tabs from '@subwallet/extension-base/background/handlers/Tabs';
import { AccountAuthType, MessageTypes, RequestAccountList, RequestAccountSubscribe, RequestAuthorizeTab, RequestTypes, ResponseTypes } from '@subwallet/extension-base/background/types';
import { canDerive } from '@subwallet/extension-base/utils';
import KoniState from '@subwallet/extension-koni-base/background/handlers/State';

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

  console.log(accountAuthType);

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

  constructor (koniState: KoniState) {
    super(koniState);
    this.#koniState = koniState;
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
      default:
        return super.handle(id, type, request, url, port);
    }
  }
}
