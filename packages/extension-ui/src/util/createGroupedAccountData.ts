// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountJson, AccountWithChildren } from '@polkadot/extension-base/background/types';
import getNetworkMap from '@polkadot/extension-ui/util/getNetworkMap';

type IterationKeys = 'children' | 'parents';
interface GroupedData {
  [key: string]: AccountWithChildren[];
}

const networkMap = getNetworkMap();

const findOtherItemGenesis = (item: AccountJson, idx: number, arr: AccountJson[]) =>
  arr
    .filter((_, index) => index !== idx)
    .find((i) =>
      item.genesisHash
        ? i.genesisHash === item.genesisHash && !i.parentAddress
        : !i.genesisHash && i.address === item.parentAddress
    );

export const createGroupedAccountData = (filteredAccount: AccountWithChildren[]) => {
  const flattened: AccountJson[] = filteredAccount.reduce((acc: AccountJson[], next) => {
    if (next.children) {
      next.children.forEach((c) => acc.push(c));
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { children, ...rest } = next;

    acc.push(rest);

    return acc;
  }, []);

  const { children, parents } = flattened.reduce<Record<IterationKeys, AccountJson[]>>(
    (acc, next, idx, arr) => {
      const type: IterationKeys = next.parentAddress && findOtherItemGenesis(next, idx, arr) ? 'children' : 'parents';

      acc[type] = acc[type].concat(next);

      return acc;
    },
    { children: [], parents: [] }
  );

  const groupedParents: GroupedData = parents.reduce(
    (acc: GroupedData, next: AccountWithChildren) => {
      const { genesisHash } = next;
      const foundKey = networkMap.get(genesisHash as string)?.replace(/-/g, ' ');

      if (!foundKey) {
        acc.any.push(next);
      } else {
        acc[foundKey] = (acc[foundKey] ?? []).concat(next);
      }

      return acc;
    },
    { any: [], 'Aleph Zero': [], 'Aleph Zero Testnet': [] }
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
