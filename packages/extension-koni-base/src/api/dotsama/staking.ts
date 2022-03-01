// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import axios from 'axios';

import { APIItemState, ApiProps, NetWorkInfo, StakingItem } from '@polkadot/extension-base/background/KoniTypes';
import NETWORKS from '@polkadot/extension-koni-base/api/endpoints';

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
  astar: NETWORKS.astar
  // moonbeam: NETWORKS.moonbeam
};

export async function subscribeStaking (addresses: string[], dotSamaAPIMap: Record<string, ApiProps>, callback: (networkKey: string, rs: StakingItem) => void, networks: Record<string, NetWorkInfo> = DEFAULT_STAKING_NETWORKS) {
  const allApiPromise: Record<string, any>[] = [];
  const apis: Record<string, any>[] = [];

  Object.entries(networks).forEach(([networkKey, networkInfo]) => {
    allApiPromise.push({ chain: networkKey, api: dotSamaAPIMap[networkKey] });
  });

  await Promise.all(allApiPromise.map(async ({ api: apiPromise, chain }) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
    const api = await apiPromise.isReady;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    apis.push({ chain, api });
  }));

  const unsubPromises = apis.map(({ api: parentApi, chain }) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-return
    return parentApi.api.query.staking?.ledger.multi(addresses, (ledgers: any[]) => {
      let totalBalance = 0;
      let unit = '';

      if (ledgers) {
        for (const ledger of ledgers) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
          const data = ledger.toHuman() as unknown as LedgerData;

          // const currentAddress = addresses[index];
          if (data && data.active) {
            const balance = data.active;
            const amount = balance ? balance.split(' ')[0] : '';

            unit = balance ? balance.split(' ')[1] : '';
            totalBalance += parseFloat(amount);
          }
        }

        if (totalBalance > 0) {
          const stakingItem = {
            name: NETWORKS[chain as string].chain,
            chainId: chain as string,
            balance: totalBalance.toString(),
            nativeToken: NETWORKS[chain as string].nativeToken,
            unit: unit || NETWORKS[chain as string].nativeToken,
            state: APIItemState.READY
          } as StakingItem;

          // eslint-disable-next-line node/no-callback-literal
          callback(chain as string, stakingItem);
        }
      }
    });
  });

  return async () => {
    const unsubs = await Promise.all(unsubPromises);

    unsubs.forEach((unsub) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      unsub && unsub();
    });
  };
}

export const getSubqueryKusamaStakingReward = async (account: string): Promise<Record<string, any>> => {
  const resp = await axios({
    url: 'https://api.subquery.network/sq/nova-wallet/nova-kusama',
    method: 'post',
    data: {
      query: `
        query {
          accumulatedRewards (filter: {id: {equalTo: "${account}"}}) {
            nodes {
              id
              amount
            }
          }
        }
      `
    }
  });

  if (resp.status === 200) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return resp.data.data as Record<string, any>;
  }

  return {};
};

export const getSubqueryPolkadotStakingReward = async (account: string): Promise<Record<string, any>> => {
  const resp = await axios({
    url: 'https://api.subquery.network/sq/nova-wallet/nova-polkadot',
    method: 'post',
    data: {
      query: `
        query {
          accumulatedRewards (filter: {id: {equalTo: "${account}"}}) {
            nodes {
              id
              amount
            }
          }
        }
      `
    }
  });

  if (resp.status === 200) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return resp.data.data as Record<string, any>;
  }

  return {};
};

export const getSubqueryAstarStakingReward = async (account: string): Promise<Record<string, any>> => {
  const resp = await axios({
    url: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-astar',
    method: 'post',
    data: {
      query: `
        query {
          accumulatedRewards (filter: {id: {equalTo: "${account}"}}) {
            nodes {
              id
              amount
            }
          }
        }
      `
    }
  });

  if (resp.status === 200) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return resp.data.data as Record<string, any>;
  }

  return {};
};

export const getSubqueryStakingReward = async (account: string[]): Promise<> => {

}

// '7Hja2uSzxdqcJv1TJi8saFYsBjurQZtJE49v4SXVC5Dbm8KM'
