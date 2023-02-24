// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountJson, AccountWithChildren } from '@polkadot/extension-base/background/types';
import { knownGenesis } from '@polkadot/networks/defaults';

interface GroupedData {
  [key: string]: AccountWithChildren[];
}

export const createGroupedAccountData = (filteredAccount: AccountWithChildren[]) => {
  const flattened: AccountJson[] = filteredAccount.reduce((acc: AccountJson[], next) => {
    if (next.children) {
      next.children.forEach((c) => acc.push(c));
      delete next.children;
    }

    acc.push(next);

    return acc;
  }, []);

  const children = flattened.filter((item) => item.parentAddress);

  const parents = flattened.filter((item) => !item.parentAddress);

  const groupedParents: GroupedData = parents.reduce(
    (acc: GroupedData, next: AccountWithChildren) => {
      const { genesisHash } = next;
      const foundKey = Object.keys(knownGenesis).find((key) => knownGenesis[key].includes(genesisHash ?? ''));

      if (!foundKey) {
        acc.any.push(next);
      } else {
        acc[foundKey] = (acc[foundKey] ?? []).concat(next);
      }

      return acc;
    },
    { any: [] }
  );

  function filterChildren(networkName: string, defaultNetwork: string, details: AccountWithChildren[]) {
    return children.filter((child) => {
      if (!child.genesisHash && networkName === defaultNetwork) {
        return true;
      }

      return details.some((d) => d.genesisHash === child.genesisHash);
    });
  }

  function getParentName(child: AccountJson) {
    const parent = parents.find((i) => i.address === child.parentAddress);

    return parent?.name;
  }

  return {
    filterChildren,
    getParentName,
    groupedParents
  };
};
