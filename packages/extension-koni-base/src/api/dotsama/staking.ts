// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import axios from 'axios';

import { ApiProps, NetWorkInfo, StakingItem } from '@polkadot/extension-base/background/KoniTypes';
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
            unit: unit || NETWORKS[chain as string].nativeToken
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

export const getSubqueryStakingReward = async (account: string): Promise<Record<string, any>> => {
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

// const getMultiCurrentBonded = async ({ addresses, apiMap }: PropsSubscribe): Promise<StakingItem[]> => {
//   try {
//     const result: Array<StakingItem> = [];
//
//     await Promise.all(apiMap.map(async ({ api: parentApi, chain }) => {
//       // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
//       const ledgers = await parentApi.api.query.staking?.ledger.multi(addresses);
//       let totalBalance = 0;
//       let unit = '';
//
//       if (ledgers) {
//         for (const ledger of ledgers) {
//           // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
//           const data = ledger.toHuman() as unknown as LedgerData;
//
//           // const currentAddress = addresses[index];
//           if (data && data.active) {
//             const balance = data.active;
//             const amount = balance ? balance.split(' ')[0] : '';
//
//             unit = balance ? balance.split(' ')[1] : '';
//             totalBalance += parseFloat(amount);
//           }
//         }
//
//         if (totalBalance > 0) {
//           result.push({
//             name: NETWORKS[chain as string].chain,
//             chainId: chain as string,
//             balance: totalBalance.toString(),
//             nativeToken: NETWORKS[chain as string].nativeToken,
//             unit: unit || NETWORKS[chain as string].nativeToken
//           } as StakingItem);
//         }
//       }
//     }));
//
//     return result;
//   } catch (e) {
//     console.error('Error getting staking data', e);
//
//     return [];
//   }
// };

// export const getStakingReward = async (addresses: string[]): Promise<any> => {
//
//
//   return fetch(url, {
//     method: 'GET',
//     headers: { 'Content-Type': 'application/json' }
//   })
//     .then((res) => res.json());
//   return;
// }

// deprecated

// '7Hja2uSzxdqcJv1TJi8saFYsBjurQZtJE49v4SXVC5Dbm8KM'
// export const getStakingInfo = async (accountId: string): Promise<StakingJson> => {
//   const result: any[] = [];
//   const targetChains = ['polkadot', 'kusama', 'hydradx', 'astar', 'moonbeam'];
//
//   const apiPromises: any[] = [];
//
//   targetChains.map((item) => {
//     // @ts-ignore
//     const apiPromise = wsProvider({ provider: networks[item].provider });
//
//     apiPromises.push(apiPromise);
//   });
//
//   const apis = await Promise.all(apiPromises);
//   const balances = await getMultiCurrentBonded({ apis, accountId: accountId });
//
//   for (const i in targetChains) {
//     const currentChain = targetChains[i];
//
//     if (balances && balances[i]) {
//       const currentBalance = balances[i];
//       const amount = currentBalance ? currentBalance.split(' ')[0] : '';
//       const unit = currentBalance ? currentBalance.split(' ')[1] : '';
//
//       result.push({
//         name: networks[currentChain].chain,
//         chainId: currentChain,
//         balance: amount,
//         nativeToken: networks[currentChain].nativeToken,
//         unit: unit || networks[currentChain].nativeToken
//       } as StakingItem);
//     }
//   }
//
//   return {
//     details: result
//   } as StakingJson;
// };
//
// export const getCurrentBonded = async ({ accountId, api }: Props): Promise<string> => {
//   const ledger = (await api.query.staking.ledger(accountId));
//   const data = ledger.toHuman() as unknown as LedgerData;
//
//   return data.active;
// };
//
// export const getMultiCurrentBonded = async ({ accountId, apis }: PropsMulti): Promise<any> => {
//   try {
//     return await Promise.all(apis.map(async (api: any) => {
//       const ledger = await api.query.staking?.ledger(accountId);
//
//       if (ledger) {
//         const data = ledger.toHuman() as unknown as LedgerData;
//
//         if (data && data.active) return data.active;
//         else return null;
//       }
//
//       return null;
//     }));
//   } catch (e) {
//     console.error('Error getting staking data', e);
//
//     return null;
//   }
// };
//
// const wsProvider = async ({ provider }: NetWorkInfo, type?: any): Promise<ApiPromise> => {
//   // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
//   const wsProvider = new WsProvider(provider);
//
//   return ApiPromise.create({ provider: wsProvider, types: type });
// };
