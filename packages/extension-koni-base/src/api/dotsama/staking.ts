// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {ApiProps, NetWorkInfo, StakingItem, StakingJson} from '@polkadot/extension-base/background/KoniTypes';
import networks from '@polkadot/extension-koni-base/api/endpoints';
import NETWORKS from "@polkadot/extension-koni-base/api/endpoints";

interface LedgerData {
  active: string,
  claimedRewards: string[],
  stash: string,
  total: string,
  unlocking: string[]
}

const DEFAULT_STAKING_NETWORKS = {
  'polkadot': NETWORKS.polkadot,
  'kusama': NETWORKS.kusama,
  'hydradx': NETWORKS.hydradx,
  'astar': NETWORKS.astar,
  'moonbeam': NETWORKS.moonbeam
}

interface PropsSubscribe {
  addresses: string[],
  apiMap: Record<string, any>[]
}

export const subscribeMultiCurrentBonded = async ({addresses, apiMap}: PropsSubscribe): Promise<any> => {
  try {
    let result: Array<StakingItem> = [];

    await Promise.all(apiMap.map(async ({chain, api: parentApi}) => {
      const ledgers = await parentApi.api.query.staking?.ledger.multi(addresses);
      let totalBalance = 0;
      let unit: string = '';
      if (ledgers) {
        ledgers.map((ledger: any, index: number) => {
          const data = ledger.toHuman() as unknown as LedgerData;
          // const currentAddress = addresses[index];
          if (data && data.active) {
            const balance = data.active;
            const amount = balance ? balance.split(' ')[0] : '';
            unit = balance ? balance.split(' ')[1] : '';
            totalBalance += parseFloat(amount);
          }
        });
        if (totalBalance > 0) {
          result.push({
            name: networks[chain].chain,
            chainId: chain,
            balance: totalBalance.toString(),
            nativeToken: networks[chain].nativeToken,
            unit: unit || networks[chain].nativeToken
          } as StakingItem);
        }
      }
    }));

    return result;
  } catch (e) {
    console.error('Error getting staking data', e);
    return null;
  }
};

export const subscribeStaking = async (addresses: string[], dotSamaAPIMap: Record<string, ApiProps>, networks: Record<string, NetWorkInfo> = DEFAULT_STAKING_NETWORKS): Promise<StakingJson> => {
  let allApiPromise: Record<string, any>[] = [];
  let apis: Record<string, any>[] = [];
  Object.entries(networks).forEach(([networkKey, networkInfo]) => {
    allApiPromise.push({chain: networkKey, api: dotSamaAPIMap[networkKey]});
  });

  await Promise.all(allApiPromise.map(async ({chain, api: apiPromise}) => {
    const api = await apiPromise.isReady;
    apis.push({chain, api});
  }));

  const stakingItems = await subscribeMultiCurrentBonded({ apiMap: apis, addresses });
  console.log(`fetched ${stakingItems.length} staking items`)

  return {
    ready: true,
    details: stakingItems
  } as StakingJson;
}

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
