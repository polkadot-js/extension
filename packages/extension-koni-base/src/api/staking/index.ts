// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { APIItemState, ApiProps, DelegationItem, NetworkJson, StakingItem } from '@subwallet/extension-base/background/KoniTypes';
import { parseRawNumber } from '@subwallet/extension-koni-base/api/bonding/utils';
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
  polkadot: PREDEFINED_NETWORKS.polkadot,
  kusama: PREDEFINED_NETWORKS.kusama,
  hydradx: PREDEFINED_NETWORKS.hydradx,
  // acala: PREDEFINED_NETWORKS.acala,
  aleph: PREDEFINED_NETWORKS.aleph,
  // astar: NETWORKS.astar,
  moonbeam: PREDEFINED_NETWORKS.moonbeam,
  moonbase: PREDEFINED_NETWORKS.moonbase
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

  return await Promise.all(allApiPromise.map(async ({ api: apiPromise, chain }) => {
    const parentApi = await apiPromise.isReady;
    const useAddresses = apiPromise.isEthereum ? evmAddresses : substrateAddresses;

    if (['moonbeam', 'moonriver', 'moonbase'].includes(chain)) {
      return getMoonBeamStakingOnChain(parentApi, useAddresses, networks, chain, callback);
    }

    return getRelayStakingOnChain(parentApi, useAddresses, networks, chain, callback);
  }));
}

function getMoonBeamStakingOnChain (parentApi: ApiProps, useAddresses: string[], networks: Record<string, NetworkJson>, chain: string, callback: (networkKey: string, rs: StakingItem) => void) {
  return parentApi.api.query.parachainStaking.delegatorState.multi(useAddresses, async (ledgers: any) => {
    let totalBalance = 0;
    // const activeBalance = 0;
    // const unlockingBalance = 0;
    let stakingItem: StakingItem;
    const delegationMap: Record<string, string> = {};

    if (ledgers) {
      for (const ledger of ledgers) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        const data = ledger.toHuman() as Record<string, any> | null;

        if (data !== null) {
          let _totalBalance = data.total as string;
          const _delegations = data.delegations as Record<string, string>[];

          for (const item of _delegations) {
            if (item.owner in delegationMap) {
              delegationMap[item.owner] = (parseRawNumber(item.amount) + parseRawNumber(delegationMap[item.owner])).toString();
            } else {
              delegationMap[item.owner] = parseRawNumber(item.amount).toString();
            }
          }

          _totalBalance = _totalBalance.replaceAll(',', '');

          totalBalance += parseFloat(_totalBalance);
        }
      }

      const delegationsList: DelegationItem[] = [];

      await Promise.all(Object.entries(delegationMap).map(async ([owner, amount]) => {
        const _identity = await parentApi.api.query.identity.identityOf(owner);
        const rawIdentity = _identity.toHuman() as Record<string, any> | null;
        let identity;

        if (rawIdentity !== null) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          const displayName = rawIdentity?.info?.display?.Raw as string;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          const legal = rawIdentity?.info?.legal?.Raw as string;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          const web = rawIdentity?.info?.web?.Raw as string;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          const riot = rawIdentity?.info?.riot?.Raw as string;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          const email = rawIdentity?.info?.email?.Raw as string;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          const twitter = rawIdentity?.info?.twitter?.Raw as string;

          if (displayName && !displayName.startsWith('0x')) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            identity = displayName;
          } else if (legal && !legal.startsWith('0x')) {
            identity = legal;
          } else {
            identity = twitter || web || email || riot;
          }
        }

        delegationsList.push({
          owner,
          amount,
          identity
        });
      }));

      const parsedTotalBalance = parseStakingBalance(totalBalance, chain, networks);

      if (totalBalance > 0) {
        stakingItem = {
          name: networks[chain].chain,
          chainId: chain,
          balance: parsedTotalBalance.toString(),
          activeBalance: parsedTotalBalance.toString(),
          unlockingBalance: '0',
          nativeToken: networks[chain].nativeToken,
          unit: networks[chain].nativeToken,
          state: APIItemState.READY,
          delegation: delegationsList
        } as StakingItem;
      } else {
        stakingItem = {
          name: networks[chain].chain,
          chainId: chain,
          balance: parsedTotalBalance.toString(),
          activeBalance: parsedTotalBalance.toString(),
          unlockingBalance: '0',
          nativeToken: networks[chain].nativeToken,
          unit: networks[chain].nativeToken,
          state: APIItemState.READY
        } as StakingItem;
      }

      // eslint-disable-next-line node/no-callback-literal
      callback(chain, stakingItem);
    }
  });
}

function getRelayStakingOnChain (parentApi: ApiProps, useAddresses: string[], networks: Record<string, NetworkJson>, chain: string, callback: (networkKey: string, rs: StakingItem) => void) {
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
}
