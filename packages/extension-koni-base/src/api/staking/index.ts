// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { APIItemState, ApiProps, NetworkJson, StakingItem } from '@subwallet/extension-base/background/KoniTypes';
import { PREDEFINED_NETWORKS } from '@subwallet/extension-koni-base/api/predefinedNetworks';
import { IGNORE_GET_SUBSTRATE_FEATURES_LIST } from '@subwallet/extension-koni-base/constants';
import { categoryAddresses, toUnit } from '@subwallet/extension-koni-base/utils/utils';

interface LedgerData {
  active: string,
  claimedRewards: string[],
  stash: string,
  total: string,
  unlocking: Record<string, string>[]
}

export const DEFAULT_STAKING_NETWORKS = {
  // polkadot: PREDEFINED_NETWORKS.polkadot,
  // kusama: PREDEFINED_NETWORKS.kusama,
  // hydradx: PREDEFINED_NETWORKS.hydradx,
  // acala: PREDEFINED_NETWORKS.acala,
  aleph: PREDEFINED_NETWORKS.aleph
  // astar: NETWORKS.astar,
  // moonbeam: NETWORKS.moonbeam
};

interface PromiseMapping {
  api: ApiProps,
  chain: string
}

function parseStakingBalance (balance: number, chain: string, network: Record<string, NetworkJson>): number {
  if (chain === 'hydradx') {
    return balance;
  } else {
    return toUnit(balance, network[chain].decimals as number);
  }
}

export async function stakingOnChainApi (addresses: string[], dotSamaAPIMap: Record<string, ApiProps>, callback: (networkKey: string, rs: StakingItem) => void, networks: Record<string, NetworkJson> = DEFAULT_STAKING_NETWORKS) {
  const allApiPromise: PromiseMapping[] = [];
  const [substrateAddresses, evmAddresses] = categoryAddresses(addresses);

  Object.entries(networks).forEach(([networkKey, networkInfo]) => {
    if (IGNORE_GET_SUBSTRATE_FEATURES_LIST.indexOf(networkKey) < 0 && (networkInfo.getStakingOnChain && networkInfo.getStakingOnChain) && networkInfo.active) {
      allApiPromise.push({ chain: networkKey, api: dotSamaAPIMap[networkKey] });
    }
  });

  const unsubs = await Promise.all(allApiPromise.map(async ({ api: apiPromise, chain }) => {
    const parentApi = await apiPromise.isReady;
    const useAddresses = apiPromise.isEthereum ? evmAddresses : substrateAddresses;

    return parentApi.api.query.staking?.ledger.multi(useAddresses, (ledgers: any[]) => {
      let totalBalance = 0;
      let activeBalance = 0;
      let unlockingBalance = 0;
      let unit = '';
      let stakingItem: StakingItem;

      if (ledgers) {
        for (const ledger of ledgers) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
          const data = ledger.toHuman() as unknown as LedgerData;

          if (data && data.active) {
            const _totalBalance = data.total;
            const _activeBalance = data.active;

            data.unlocking.forEach(({ value }) => {
              value = value.split(' ')[0];
              const _unlockingBalance = value.replaceAll(',', '');

              unlockingBalance += parseFloat(_unlockingBalance);
            });

            let amount = _totalBalance ? _totalBalance.split(' ')[0] : '';

            amount = amount.replaceAll(',', '');
            unit = _totalBalance ? _totalBalance.split(' ')[1] : '';
            totalBalance += parseFloat(amount);

            amount = _activeBalance ? _activeBalance.split(' ')[0] : '';
            amount = amount.replaceAll(',', '');
            unit = _activeBalance ? _activeBalance.split(' ')[1] : '';
            activeBalance += parseFloat(amount);
          }
        }

        const parsedActiveBalance = parseStakingBalance(activeBalance, chain, networks);
        const parsedUnlockingBalance = parseStakingBalance(unlockingBalance, chain, networks);
        const parsedTotal = parseStakingBalance(totalBalance, chain, networks);

        if (totalBalance > 0) {
          stakingItem = {
            name: networks[chain].chain,
            chainId: chain,
            balance: parsedTotal.toString(),
            activeBalance: parsedActiveBalance.toString(),
            unlockingBalance: parsedUnlockingBalance.toString(),
            nativeToken: networks[chain].nativeToken,
            unit: unit || networks[chain].nativeToken,
            state: APIItemState.READY
          } as StakingItem;
        } else {
          stakingItem = {
            name: networks[chain].chain,
            chainId: chain,
            balance: parsedTotal.toString(),
            activeBalance: parsedActiveBalance.toString(),
            unlockingBalance: parsedUnlockingBalance.toString(),
            nativeToken: networks[chain].nativeToken,
            unit: unit || networks[chain].nativeToken,
            state: APIItemState.READY
          } as StakingItem;
        }

        // eslint-disable-next-line node/no-callback-literal
        callback(chain, stakingItem);
      }
    });
  }));

  return () => {
    unsubs.forEach((unsub) => unsub && unsub());
  };
}
