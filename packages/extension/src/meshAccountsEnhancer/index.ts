
// Copyright 2020-2021 @polymath-network authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import accountsObservable from '@polkadot/ui-keyring/observable/accounts';
import { SubjectInfo } from '@polkadot/ui-keyring/observable/types';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { assert } from '@polkadot/util';
import { Option } from '@polkadot/types/codec';

import keyring from '@polkadot/ui-keyring';
import meshApi from './meshApi';
import { LinkedKeyInfo } from './meshTypes';
import { AccountInfo } from '@polkadot/types/interfaces/system';

function transformAccounts (accounts: SubjectInfo): string[] {
  return Object.values(accounts).map(({ json: { address } }): string => address);
}

type UnsubCallback = () => void;

function meshAccountsEnhancer (): void {
  meshApi.then((api) => {
    const unsubCallbacks: Record<string, UnsubCallback> = {};

    // @TODO manage this subscription.
    const subscription = accountsObservable.subject.subscribe((accounts: SubjectInfo): void => {
      const currentAccounts = Object.keys(unsubCallbacks);
      const transformedAccounts = transformAccounts(accounts).filter((account) => !unsubCallbacks[account]);
      const newAccounts = transformedAccounts.filter((account) => !unsubCallbacks[account]);
      const removedAccounts = currentAccounts.filter((account) => transformedAccounts.indexOf(account) === -1);

      // @TODO construct a single queries array
      newAccounts.forEach((account) => {
        api.queryMulti([
          [api.query.system.account, account],
          [api.query.identity.keyToIdentityIds, account]
        ], ([accData, linkedKeyInfo]: [AccountInfo, Option<LinkedKeyInfo>]) => {
          const pair = keyring.getPair(account);

          assert(pair, 'Unable to find pair');
          const balance = accData.data.free.toNumber();
          const did = linkedKeyInfo.unwrapOrDefault().asUnique;

          keyring.saveAccountMeta(pair, { ...pair.meta, balance, did: did.toString() });
        }).then((unsub) => {
          unsubCallbacks[account] = unsub;
        }).catch(console.error);
      });

      // @TODO Unsubscribe from removed accounts.
      // console.log('currentAccounts, transformedAccounts, newAccounts, removedAccounts', currentAccounts, transformedAccounts, newAccounts, removedAccounts);
      // removedAccounts.forEach((account) => unsubCallbacks[account]());
    });

    console.log('meshAccountsEnhancer initialization completed');
  }).catch((err) => console.error('meshAccountsEnhancer initialization failed', err));
}

export default meshAccountsEnhancer;
