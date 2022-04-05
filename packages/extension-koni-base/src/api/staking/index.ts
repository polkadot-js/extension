// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { APIItemState, ApiProps, NetWorkInfo, StakingItem } from '@polkadot/extension-base/background/KoniTypes';
import NETWORKS from '@polkadot/extension-koni-base/api/endpoints';
import { categoryAddresses, toUnit } from '@polkadot/extension-koni-base/utils/utils';

import { ethereumChains } from '../dotsama/api-helper';
import { IGNORE_GET_SUBSTRATE_FEATURES_LIST } from '@polkadot/extension-koni-base/constants';

interface LedgerData {
  active: string,
  claimedRewards: string[],
  stash: string,
  total: string,
  unlocking: string[]
}

export const DEFAULT_STAKING_NETWORKS = {
  polkadot: NETWORKS.polkadot,
  kusama: NETWORKS.kusama,
  hydradx: NETWORKS.hydradx,
  acala: NETWORKS.acala
  // astar: NETWORKS.astar,
  // moonbeam: NETWORKS.moonbeam
};

interface PromiseMapping {
  api: ApiProps,
  chain: string
}

function parseStakingBalance (balance: number, chain: string): number {
  if (chain === 'hydradx') {
    return balance;
  } else {
    return toUnit(balance, NETWORKS[chain].decimals as number);
  }
}

export async function subscribeStaking (addresses: string[], dotSamaAPIMap: Record<string, ApiProps>, callback: (networkKey: string, rs: StakingItem) => void, networks: Record<string, NetWorkInfo> = DEFAULT_STAKING_NETWORKS) {
  const allApiPromise: PromiseMapping[] = [];
  const [substrateAddresses, evmAddresses] = categoryAddresses(addresses);

  Object.entries(networks).forEach(([networkKey, networkInfo]) => {
    if (IGNORE_GET_SUBSTRATE_FEATURES_LIST.indexOf(networkKey) < 0) {
      allApiPromise.push({ chain: networkKey, api: dotSamaAPIMap[networkKey] });
    }
  });

  const unsubPromises = await Promise.all(allApiPromise.map(async ({ api: apiPromise, chain }) => {
    const parentApi = await apiPromise.isReady;
    const useAddresses = ethereumChains.indexOf(chain) > -1 ? evmAddresses : substrateAddresses;

    return parentApi.api.query.staking?.ledger.multi(useAddresses, (ledgers: any[]) => {
      let totalBalance = 0;
      let unit = '';
      let stakingItem: StakingItem;

      if (ledgers) {
        for (const ledger of ledgers) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
          const data = ledger.toHuman() as unknown as LedgerData;

          // const currentAddress = addresses[index];
          if (data && data.active) {
            const balance = data.active;
            let amount = balance ? balance.split(' ')[0] : '';

            amount = amount.replaceAll(',', '');
            unit = balance ? balance.split(' ')[1] : '';
            totalBalance += parseFloat(amount);
          }
        }

        const parsedTotal = parseStakingBalance(totalBalance, chain);

        if (totalBalance > 0) {
          stakingItem = {
            name: NETWORKS[chain].chain,
            chainId: chain,
            balance: parsedTotal.toString(),
            nativeToken: NETWORKS[chain].nativeToken,
            unit: unit || NETWORKS[chain].nativeToken,
            state: APIItemState.READY
          } as StakingItem;
        } else {
          stakingItem = {
            name: NETWORKS[chain].chain,
            chainId: chain,
            balance: parsedTotal.toString(),
            nativeToken: NETWORKS[chain].nativeToken,
            unit: unit || NETWORKS[chain].nativeToken,
            state: APIItemState.READY
          } as StakingItem;
        }

        // eslint-disable-next-line node/no-callback-literal
        callback(chain, stakingItem);
      }
    });
  }));

  return async () => {
    const unsubs = await Promise.all(unsubPromises);

    unsubs.forEach((unsub) => {
      unsub && unsub();
    });
  };
}
