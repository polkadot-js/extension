import { AccountJson, AccountWithChildren } from '@polkadot/extension-base/background/types';
import getNetworkMap from '@polkadot/extension-ui/util/getNetworkMap';

type IterationKeys = 'children' | 'parents';

interface ParsedAccountJson extends AccountJson {
  nestedChild?: boolean;
}
interface GroupedData {
  [key: string]: AccountWithChildren[];
}

const networkMap = getNetworkMap();

const parseEntries = (data: AccountWithChildren | AccountJson, nestedChild = false): ParsedAccountJson[] => {
  const { children, ...rest } = data as AccountWithChildren;

  return [
    { ...rest, nestedChild },
    ...(children?.flatMap((entry) => parseEntries(entry, Boolean(data.parentAddress))) ?? [])
  ];
};

const findOtherItemGenesis = (item: AccountJson, idx: number, arr: AccountJson[]) =>
  arr
    .filter((_, index) => index !== idx)
    .find((i) =>
      item.genesisHash
        ? i.genesisHash === item.genesisHash && !i.parentAddress
        : !i.genesisHash && i.address === item.parentAddress
    );

export const createGroupedAccountData = (filteredAccount: AccountWithChildren[]) => {
  const flattened: AccountJson[] = filteredAccount.reduce(
    (acc: AccountJson[], next) => acc.concat(parseEntries(next)),
    []
  );

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

  function getParentName(child: ParsedAccountJson) {
    const parent = (child.nestedChild ? children : parents).find((i) => i.address === child.parentAddress);

    return parent?.name;
  }

  return {
    flattened,
    filterChildren,
    getParentName,
    groupedParents
  };
};
