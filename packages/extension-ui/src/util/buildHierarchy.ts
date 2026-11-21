// Copyright 2019-2026 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AccountJson, AccountWithChildren } from '@polkadot/extension-base/background/types';

import getNetworkMap from './getNetworkMap.js';

type ChildFilter = (account: AccountJson) => AccountWithChildren;

// the network map is static for the lifetime of the popup, so build it once
const networkMap = getNetworkMap();

// visible accounts are shown before hidden ones
function compareByHidden (a: AccountJson, b: AccountJson): number {
  return (a.isHidden ? 1 : 0) - (b.isHidden ? 1 : 0);
}

// sort by the network display name. When the names are equal (e.g. accounts
// tied to "any chain" or to custom networks not present in the map), fall back
// to the genesisHash so that the resulting order is always deterministic and
// does not depend on the order accounts are received in from storage
function compareByNetwork (a: AccountJson, b: AccountJson): number {
  const networkA = networkMap.get(a.genesisHash || '') || '';
  const networkB = networkMap.get(b.genesisHash || '') || '';

  return networkA.localeCompare(networkB) ||
    (a.genesisHash || '').localeCompare(b.genesisHash || '');
}

function compareByName (a: AccountJson, b: AccountJson): number {
  const nameA = a.name?.toUpperCase() || '';
  const nameB = b.name?.toUpperCase() || '';

  return nameA.localeCompare(nameB);
}

function compareByPath (a: AccountJson, b: AccountJson): number {
  const suriA = a.suri?.toUpperCase() || '';
  const suriB = b.suri?.toUpperCase() || '';

  return suriA.localeCompare(suriB);
}

// accounts without a creation time are moved to the back of their group
function compareByCreation (a: AccountJson, b: AccountJson): number {
  return (a.whenCreated || Infinity) - (b.whenCreated || Infinity);
}

// the address is unique, so this final tiebreaker makes the comparator total:
// two accounts that are equal on all other keys can never swap places depending
// on the input order
function compareByAddress (a: AccountJson, b: AccountJson): number {
  return a.address.localeCompare(b.address);
}

// visible accounts first, then grouped by network, then ordered by name, path
// (derivation path), creation time and finally address (see #1000)
function compareAccounts (a: AccountJson, b: AccountJson): number {
  return compareByHidden(a, b) ||
    compareByNetwork(a, b) ||
    compareByName(a, b) ||
    compareByPath(a, b) ||
    compareByCreation(a, b) ||
    compareByAddress(a, b);
}

export function accountWithChildren (accounts: AccountJson[]): ChildFilter {
  return (account: AccountJson): AccountWithChildren => {
    const children = accounts
      .filter(({ parentAddress }) => account.address === parentAddress)
      .map(accountWithChildren(accounts))
      .sort(compareAccounts);

    return children.length === 0
      ? account
      : { children, ...account };
  };
}

export function buildHierarchy (accounts: AccountJson[]): AccountWithChildren[] {
  return accounts
    .filter(({ parentAddress }) =>
      // it is a parent
      !parentAddress ||
      // we don't have a parent for this one
      !accounts.some(({ address }) => parentAddress === address)
    )
    .map(accountWithChildren(accounts))
    .sort(compareAccounts);
}
