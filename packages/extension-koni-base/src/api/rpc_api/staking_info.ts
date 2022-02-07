// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiPromise } from '@polkadot/api';
import { StakingItem, StakingJson } from '@polkadot/extension-base/background/KoniTypes';
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

        return data.active;
      }

      return null;
    }));
  } catch (e) {
    console.error('Error getting staking data', e);

    return null;
  }
};

export const getStakingInfo = async (accountId: string): Promise<StakingJson> => {
  console.log('Getting staking for ', accountId);
  const result: any[] = [];
  const targetChains = ['polkadot', 'kusama'];

  const apiPromises: any[] = [];

  targetChains.map((item) => {
    const apiPromise = wsProvider({ provider: networks[item].provider });

    apiPromises.push(apiPromise);
  });

  const apis = await Promise.all(apiPromises);

  const balances = await getMultiCurrentBonded({ apis, accountId: accountId });

  for (const i in targetChains) {
    const currentChain = targetChains[i];
    const currentBalance = balances[i];
    const amount = currentBalance ? currentBalance.split(' ')[0] : '';
    const unit = currentBalance ? currentBalance.split(' ')[1] : '';

    result.push({
      name: networks[currentChain].chain,
      chainId: '',
      paraId: currentChain,
      balance: amount,
      nativeToken: 'DOT',
      unit: unit || 'DOT'
    } as StakingItem);
  }

  console.log('staking info', result);

  return {
    details: result
  } as StakingJson;
};
