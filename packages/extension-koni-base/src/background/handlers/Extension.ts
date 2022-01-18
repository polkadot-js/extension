// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import Extension from '@polkadot/extension-base/background/handlers/Extension';
import { createSubscription, unsubscribe } from '@polkadot/extension-base/background/handlers/subscriptions';
import { PriceJson } from '@polkadot/extension-base/background/KoniTypes';
import { AccountJson, AccountsWithCurrentAddress, MessageTypes, RequestCurrentAccountAddress, RequestTypes, ResponseType } from '@polkadot/extension-base/background/types';
import { state } from '@polkadot/extension-koni-base/background/handlers/index';
import { accounts as accountsObservable } from '@polkadot/ui-keyring/observable/accounts';
import { SubjectInfo } from '@polkadot/ui-keyring/observable/types';

function transformAccounts (accounts: SubjectInfo): AccountJson[] {
  return Object.values(accounts).map(({ json: { address, meta }, type }): AccountJson => ({
    address,
    ...meta,
    type
  }));
}

export default class KoniExtension extends Extension {
  private accountsGetAllWithCurrentAddress (id: string, port: chrome.runtime.Port): boolean {
    const cb = createSubscription<'pri(accounts.getAllWithCurrentAddress)'>(id, port);
    const subscription = accountsObservable.subject.subscribe((accounts: SubjectInfo): void => {
      const accountsWithCurrentAddress: AccountsWithCurrentAddress = {
        accounts: transformAccounts(accounts)
      };

      state.getCurrentAccount((accountInfo) => {
        if (accountInfo) {
          accountsWithCurrentAddress.currentAddress = accountInfo.address;
        }

        cb(accountsWithCurrentAddress);
      });
    });

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
      subscription.unsubscribe();
    });

    return true;
  }

  private _saveCurrentAccountAddress (address: string, callback?: () => void) {
    state.getCurrentAccount((accountInfo) => {
      if (!accountInfo) {
        accountInfo = {
          address
        };
      } else {
        accountInfo.address = address;
      }

      state.setCurrentAccount(accountInfo, callback);
    });
  }

  private saveCurrentAccountAddress ({ address }: RequestCurrentAccountAddress): boolean {
    this._saveCurrentAccountAddress(address);

    return true;
  }

  private getPrice (): Promise<PriceJson> {
    return new Promise<PriceJson>((resolve, reject) => {
      state.getPrice((rs: PriceJson) => {
        resolve(rs);
      });
    });
  }

  private subscribePrice (id: string, port: chrome.runtime.Port): boolean {
    const cb = createSubscription<'pri(price.getSubscription)'>(id, port);

    state.subscribePrice().subscribe({
      next: (rs) => {
        cb(rs);
      }
    });

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
    });

    return true;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public override async handle<TMessageType extends MessageTypes> (id: string, type: TMessageType, request: RequestTypes[TMessageType], port: chrome.runtime.Port): Promise<ResponseType<TMessageType>> {
    switch (type) {
      case 'pri(accounts.getAllWithCurrentAddress)':
        return this.accountsGetAllWithCurrentAddress(id, port);
      case 'pri(currentAccount.saveAddress)':
        return this.saveCurrentAccountAddress(request as RequestCurrentAccountAddress);
      case 'pri(price.getPrice)':
        return await this.getPrice();
      case 'pri(price.getSubscription)':
        return this.subscribePrice(id, port);
      default:
        return super.handle(id, type, request, port);
    }
  }
}
