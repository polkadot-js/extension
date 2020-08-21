
// Copyright 2020-2021 @polymath-network authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import accountsObservable from '@polkadot/ui-keyring/observable/accounts';
import { SubjectInfo } from '@polkadot/ui-keyring/observable/types';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { assert } from '@polkadot/util';

import keyring from '@polkadot/ui-keyring';
import meshApi from './meshApi';

function transformAccounts (accounts: SubjectInfo): string[] {
  return Object.values(accounts).map(({ json: { address } }): string => address);
}

type UnsubCallback = () => void;

function meshAccountsEnhancer (): void {
  cryptoWaitReady()
    .then((): void => {
      meshApi.then((api) => {
        const unsubCallbacks: Record<string, UnsubCallback> = {};

        // @TODO manage this subscription.
        const subscription = accountsObservable.subject.subscribe((accounts: SubjectInfo): void => {
          const newAccounts = transformAccounts(accounts);

          newAccounts.forEach((account) => {
            if (!unsubCallbacks[account]) {
              api.query.system.account(account, (result) => {
                const pair = keyring.getPair(account);

                assert(pair, 'Unable to find pair');
                const balance = result.data.free.toNumber();

                console.log('Saving balance', account, balance);
                keyring.saveAccountMeta(pair, { ...pair.meta, balance });
              }).then((unsub) => {
                console.log('unsub callback', unsub);
                unsubCallbacks[account] = unsub;
              }).catch(console.error);
            }
          });
        });

        console.log('meshAccountsEnhancer initialization complete');
      }).catch(console.error);
    }).catch((error): void => {
      console.error('initialization failed', error);
    });
}

export default meshAccountsEnhancer;
