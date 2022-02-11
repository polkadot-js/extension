// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiPromise } from '@polkadot/api';
import {StakingItem, StakingJson} from '@polkadot/extension-base/background/KoniTypes';
import { wsProvider } from '@polkadot/extension-koni-base/api/connector';
import networks from '@polkadot/extension-koni-base/api/endpoints';

interface LedgerData {
  active: string,
  claimedRewards: string[],
  stash: string,
  total: string,
  unlocking: string[]
}
interface Props {
  api: ApiPromise,
  accountId: string
}

interface PropsMulti {
  apis: any,
  accountId: string,
}

export const getCurrentBonded = async ({ accountId, api }: Props): Promise<string> => {
  const ledger = (await api.query.staking.ledger(accountId));
  const data = ledger.toHuman() as unknown as LedgerData;

  return data.active;
};

export const getMultiCurrentBonded = async ({ accountId, apis }: PropsMulti): Promise<any> => {
  try {
    return await Promise.all(apis.map(async (api: any) => {
      const ledger = await api.query.staking?.ledger(accountId);

      if (ledger) {
        const data = ledger.toHuman() as unknown as LedgerData;

        if (data && data.active) return data.active;
        else return null;
      }

      return null;
    }));
  } catch (e) {
    console.error('Error getting staking data', e);

    return null;
  }
};

// const stakingMap = {
//   'polkadot': NETWORKS.polkadot,
//   'kusama': NETWORKS.kusama,
//   'hydradx': NETWORKS.hydradx,
//   'astar': NETWORKS.astar,
//   'moonbeam': NETWORKS.moonbeam
// }

// export const subscribeStaking = async (addresses: string[], dotSamaAPIMap: Record<string, ApiProps>, callback: (rs: StakingJson) => void, networks = NETWORKS): Promise<any> => {
//   const dotSamaAPIMap = connectDotSamaApis(stakingMap);
//   console.log(dotSamaAPIMap)
//
// }
// '7Hja2uSzxdqcJv1TJi8saFYsBjurQZtJE49v4SXVC5Dbm8KM'
export const getStakingInfo = async (accountId: string): Promise<StakingJson> => {
  const result: any[] = [];
  const targetChains = ['polkadot', 'kusama', 'hydradx', 'astar', 'moonbeam'];

  const apiPromises: any[] = [];

  targetChains.map((item) => {
    // @ts-ignore
    const apiPromise = wsProvider({ provider: networks[item].provider });

    apiPromises.push(apiPromise);
  });

  const apis = await Promise.all(apiPromises);
  const balances = await getMultiCurrentBonded({ apis, accountId: accountId });

  for (const i in targetChains) {
    const currentChain = targetChains[i];

    if (balances && balances[i]) {
      const currentBalance = balances[i];
      const amount = currentBalance ? currentBalance.split(' ')[0] : '';
      const unit = currentBalance ? currentBalance.split(' ')[1] : '';

      result.push({
        name: networks[currentChain].chain,
        chainId: '',
        paraId: currentChain,
        balance: amount,
        nativeToken: networks[currentChain].nativeToken,
        unit: unit || networks[currentChain].nativeToken
      } as StakingItem);
    }
  }

  return {
    details: result
  } as StakingJson;
};
