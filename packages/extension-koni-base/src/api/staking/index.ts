// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { APIItemState, ApiProps, NetworkJson, StakingItem, StakingType } from '@subwallet/extension-base/background/KoniTypes';
import { CHAIN_TYPES } from '@subwallet/extension-koni-base/api/bonding';
import { PREDEFINED_NETWORKS } from '@subwallet/extension-koni-base/api/predefinedNetworks';
import { IGNORE_GET_SUBSTRATE_FEATURES_LIST } from '@subwallet/extension-koni-base/constants';
import { categoryAddresses, reformatAddress, toUnit } from '@subwallet/extension-koni-base/utils';

import { Codec } from '@polkadot/types/types';
import { BN, BN_ZERO } from '@polkadot/util';

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
  aleph: PREDEFINED_NETWORKS.aleph,
  alephTest: PREDEFINED_NETWORKS.alephTest,
  moonbeam: PREDEFINED_NETWORKS.moonbeam,
  moonbase: PREDEFINED_NETWORKS.moonbase,
  polkadex: PREDEFINED_NETWORKS.polkadex,
  turing: PREDEFINED_NETWORKS.turing,
  turingStaging: PREDEFINED_NETWORKS.turingStaging,
  astar: PREDEFINED_NETWORKS.astar,
  shibuya: PREDEFINED_NETWORKS.shibuya,
  shiden: PREDEFINED_NETWORKS.shiden,
  bifrost: PREDEFINED_NETWORKS.bifrost,
  bifrost_testnet: PREDEFINED_NETWORKS.bifrost_testnet
  // acala: PREDEFINED_NETWORKS.acala,
  // darwinia: PREDEFINED_NETWORKS.darwinia,
  // pangolin: PREDEFINED_NETWORKS.pangolin,
  // crab: PREDEFINED_NETWORKS.crab,
};

interface PromiseMapping {
  api: ApiProps,
  chain: string
}

function parseStakingBalance (balance: number, chain: string, network: Record<string, NetworkJson>): number {
  return toUnit(balance, network[chain].decimals as number);
}

export function parseStakingItemKey (networkKey: string, type: StakingType = StakingType.NOMINATED) {
  return `${networkKey}_${type}`;
}

export function stakingOnChainApi (addresses: string[], dotSamaAPIMap: Record<string, ApiProps>, callback: (networkKey: string, rs: StakingItem) => void, networks: Record<string, NetworkJson> = DEFAULT_STAKING_NETWORKS) {
  const allApiPromise: PromiseMapping[] = [];
  const [substrateAddresses, evmAddresses] = categoryAddresses(addresses);

  Object.entries(networks).forEach(([networkKey, networkInfo]) => {
    if (IGNORE_GET_SUBSTRATE_FEATURES_LIST.indexOf(networkKey) < 0 && networkInfo.getStakingOnChain && networkInfo.active) {
      allApiPromise.push({ chain: networkKey, api: dotSamaAPIMap[networkKey] });
    }
  });

  const unsubList: VoidFunction[] = [];

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  allApiPromise.forEach(async ({ api: apiPromise, chain }) => {
    const parentApi = await apiPromise.isReady;
    const useAddresses = apiPromise.isEthereum ? evmAddresses : substrateAddresses;

    if (CHAIN_TYPES.astar.includes(chain)) {
      const unsub = await getAstarStakingOnChain(parentApi, useAddresses, networks, chain, callback);

      unsubList.push(unsub);
    } else if (CHAIN_TYPES.para.includes(chain)) {
      const unsub = await getParaStakingOnChain(parentApi, useAddresses, networks, chain, callback);

      unsubList.push(unsub);
    }

    const unsubRelay = await getRelayStakingOnChain(parentApi, useAddresses, networks, chain, callback);

    unsubList.push(unsubRelay);

    if (['polkadot', 'kusama', 'westend'].includes(chain)) {
      const unsub = await getRelayPoolingOnchain(parentApi, useAddresses, networks, chain, callback);

      unsubList.push(unsub);
    }
  });

  return () => {
    unsubList.forEach((unsub) => {
      unsub && unsub();
    });
  };
}

function getParaStakingOnChain (parentApi: ApiProps, useAddresses: string[], networks: Record<string, NetworkJson>, chain: string, callback: (networkKey: string, rs: StakingItem) => void) {
  return parentApi.api.query.parachainStaking.delegatorState.multi(useAddresses, (ledgers: Codec[]) => {
    if (ledgers) {
      for (let i = 0; i < ledgers.length; i++) {
        const ledger = ledgers[i];
        const data = ledger.toHuman() as Record<string, any> | null;

        if (data !== null) {
          const owner = reformatAddress(useAddresses[i], 42) || undefined;
          let _totalBalance = data.total as string;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          let _unlockingBalance = data.lessTotal ? data.lessTotal as string : data.requests.lessTotal as string;

          _totalBalance = _totalBalance.replaceAll(',', '');
          _unlockingBalance = _unlockingBalance.replaceAll(',', '');

          const totalBalance = new BN(_totalBalance);
          const unlockingBalance = new BN(_unlockingBalance);

          const formattedTotalBalance = parseFloat(totalBalance.toString());
          const formattedActiveBalance = parseFloat(totalBalance.sub(unlockingBalance).toString());
          const formattedUnlockingBalance = parseFloat(unlockingBalance.toString());

          const parsedTotalBalance = parseStakingBalance(formattedTotalBalance, chain, networks);
          const parsedUnlockingBalance = parseStakingBalance(formattedUnlockingBalance, chain, networks);
          const parsedActiveBalance = parseStakingBalance(formattedActiveBalance, chain, networks);

          const stakingItem = {
            name: networks[chain].chain,
            chain: chain,
            balance: parsedTotalBalance.toString(),
            activeBalance: parsedActiveBalance.toString(),
            unlockingBalance: parsedUnlockingBalance.toString(),
            nativeToken: networks[chain].nativeToken,
            unit: networks[chain].nativeToken,
            state: APIItemState.READY,
            type: StakingType.NOMINATED,
            address: owner
          } as StakingItem;

          // eslint-disable-next-line node/no-callback-literal
          callback(chain, stakingItem);
        }
      }
    }
  });
}

function getRelayStakingOnChain (parentApi: ApiProps, useAddresses: string[], networks: Record<string, NetworkJson>, chain: string, callback: (networkKey: string, rs: StakingItem) => void) {
  return parentApi.api.query.staking?.ledger.multi(useAddresses, (ledgers: Codec[]) => {
    let unit = '';

    if (ledgers) {
      for (let i = 0; i < ledgers.length; i++) {
        const ledger = ledgers[i];
        const data = ledger.toHuman() as unknown as LedgerData;

        if (data && data.active) {
          const owner = reformatAddress(useAddresses[i], 42) || undefined;
          const _totalBalance = data.total;
          const _activeBalance = data.active;
          let unlockingBalance = new BN(0);

          data.unlocking.forEach(({ value }) => {
            value = value.split(' ')[0];
            const _unlockingBalance = value.replaceAll(',', '');
            const bnUnlockingBalance = new BN(_unlockingBalance);

            unlockingBalance = unlockingBalance.add(bnUnlockingBalance);
          });

          let amount = _totalBalance ? _totalBalance.split(' ')[0] : '';

          amount = amount.replaceAll(',', '');
          unit = _totalBalance ? _totalBalance.split(' ')[1] : '';
          const bnTotalBalance = new BN(amount);

          amount = _activeBalance ? _activeBalance.split(' ')[0] : '';
          amount = amount.replaceAll(',', '');
          unit = _activeBalance ? _activeBalance.split(' ')[1] : '';
          const bnActiveBalance = new BN(amount);

          const formattedTotalBalance = parseFloat(bnTotalBalance.toString());
          const formattedActiveBalance = parseFloat(bnActiveBalance.toString());
          const formattedUnlockingBalance = parseFloat(unlockingBalance.toString());

          const parsedActiveBalance = parseStakingBalance(formattedActiveBalance, chain, networks);
          const parsedUnlockingBalance = parseStakingBalance(formattedUnlockingBalance, chain, networks);
          const parsedTotal = parseStakingBalance(formattedTotalBalance, chain, networks);

          const stakingItem = {
            name: networks[chain].chain,
            chain: chain,
            balance: parsedTotal.toString(),
            activeBalance: parsedActiveBalance.toString(),
            unlockingBalance: parsedUnlockingBalance.toString(),
            nativeToken: networks[chain].nativeToken,
            unit: unit || networks[chain].nativeToken,
            state: APIItemState.READY,
            type: StakingType.NOMINATED,
            address: owner
          } as StakingItem;

          callback(chain, stakingItem);
        }
      }
    }
  });
}

function getRelayPoolingOnchain (parentApi: ApiProps, useAddresses: string[], networks: Record<string, NetworkJson>, chain: string, callback: (networkKey: string, rs: StakingItem) => void) {
  return parentApi.api.query?.nominationPools?.poolMembers.multi(useAddresses, (ledgers: Codec[]) => {
    if (ledgers) {
      for (let i = 0; i < ledgers.length; i++) {
        const ledger = ledgers[i];
        const data = ledger.toHuman() as Record<string, any>;

        if (data !== null) {
          const owner = reformatAddress(useAddresses[i], 42);
          const bondedBalance = data.points as string;
          const unbondedBalance = data.unbondingEras as Record<string, string>;

          let unlockingBalance = new BN(0);
          let totalBalance = new BN(0);

          Object.entries(unbondedBalance).forEach(([era, value]) => {
            const bnUnbondedBalance = new BN(value.replaceAll(',', ''));

            unlockingBalance = unlockingBalance.add(bnUnbondedBalance);
          });

          const bnBondedBalance = new BN(bondedBalance.replaceAll(',', ''));

          totalBalance = totalBalance.add(bnBondedBalance).add(unlockingBalance);

          const formattedTotalBalance = parseFloat(totalBalance.toString());
          const formattedActiveBalance = parseFloat(bnBondedBalance.toString());
          const formattedUnlockingBalance = parseFloat(unlockingBalance.toString());

          const parsedActiveBalance = parseStakingBalance(formattedActiveBalance, chain, networks);
          const parsedUnlockingBalance = parseStakingBalance(formattedUnlockingBalance, chain, networks);
          const parsedTotal = parseStakingBalance(formattedTotalBalance, chain, networks);

          const stakingItem = {
            name: networks[chain].chain,
            chain: chain,
            balance: parsedTotal.toString(),
            activeBalance: parsedActiveBalance.toString(),
            unlockingBalance: parsedUnlockingBalance.toString(),
            nativeToken: networks[chain].nativeToken,
            unit: networks[chain].nativeToken,
            state: APIItemState.READY,
            type: StakingType.POOLED,
            address: owner
          } as StakingItem;

          callback(chain, stakingItem);
        }
      }
    }
  });
}

function getAstarStakingOnChain (parentApi: ApiProps, useAddresses: string[], networks: Record<string, NetworkJson>, chain: string, callback: (networkKey: string, rs: StakingItem) => void) {
  return parentApi.api.query.dappsStaking.ledger.multi(useAddresses, (ledgers: Codec[]) => {
    if (ledgers) {
      for (let i = 0; i < ledgers.length; i++) {
        let unlockingBalance = BN_ZERO;
        const owner = reformatAddress(useAddresses[i], 42);

        const ledger = ledgers[i];
        const data = ledger.toHuman() as Record<string, any>;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const unlockingChunks = data.unbondingInfo.unlockingChunks as Record<string, string>[];
        const _totalStake = data.locked as string;

        for (const chunk of unlockingChunks) {
          const bnChunk = new BN(chunk.amount.replaceAll(',', ''));

          unlockingBalance = unlockingBalance.add(bnChunk);
        }

        const bnTotalStake = new BN(_totalStake.replaceAll(',', ''));

        const formattedTotalBalance = parseFloat(bnTotalStake.toString());
        const formattedActiveBalance = parseFloat(bnTotalStake.sub(unlockingBalance).toString());
        const formattedUnlockingBalance = parseFloat(unlockingBalance.toString());

        const parsedTotalBalance = parseStakingBalance(formattedTotalBalance, chain, networks);
        const parsedActiveBalance = parseStakingBalance(formattedActiveBalance, chain, networks);
        const parsedUnlockingBalance = parseStakingBalance(formattedUnlockingBalance, chain, networks);

        const stakingItem = {
          name: networks[chain].chain,
          chain: chain,
          balance: parsedTotalBalance.toString(),
          activeBalance: parsedActiveBalance.toString(),
          unlockingBalance: parsedUnlockingBalance.toString(),
          nativeToken: networks[chain].nativeToken,
          unit: networks[chain].nativeToken,
          state: APIItemState.READY,
          type: StakingType.NOMINATED,
          address: owner
        } as StakingItem;

        // eslint-disable-next-line node/no-callback-literal
        callback(chain, stakingItem);
      }
    }
  });
}

// function getDarwiniaStakingOnChain (parentApi: ApiProps, useAddresses: string[], networks: Record<string, NetworkJson>, chain: string, callback: (networkKey: string, rs: StakingItem) => void) {
//   return parentApi.api.query.staking?.ledger.multi(useAddresses, (ledgers: any[]) => {
//     let totalBalance = 0;
//     let activeBalance = 0;
//     let unlockingBalance = 0;
//     const unit = '';
//     let stakingItem: StakingItem;
//     // TODO: get unstakable amount based on timestamp
//     // const timestamp = new Date().getTime();
//
//     if (ledgers) {
//       for (const ledger of ledgers) {
//         // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
//         const data = ledger.toHuman() as unknown as Record<string, any>;
//
//         if (data && data.active) {
//           // locked balance
//           const _ringLockStaking = data.ringStakingLock as Record<string, any>;
//           const unbondingLockBalance = _ringLockStaking.unbondings as Record<string, string>[];
//           let _totalActive = data.active as string;
//
//           unbondingLockBalance.forEach((item) => {
//             const _unlockingBalance = item.amount.replaceAll(',', '');
//
//             unlockingBalance += parseFloat(_unlockingBalance);
//           });
//
//           _totalActive = _totalActive.replaceAll(',', '');
//           activeBalance += parseFloat(_totalActive);
//
//           const _totalBalance = activeBalance + unlockingBalance;
//
//           totalBalance += _totalBalance;
//         }
//       }
//
//       const parsedActiveBalance = parseStakingBalance(activeBalance, chain, networks);
//       const parsedUnlockingBalance = parseStakingBalance(unlockingBalance, chain, networks);
//       const parsedTotal = parseStakingBalance(totalBalance, chain, networks);
//
//       if (totalBalance > 0) {
//         stakingItem = {
//           name: networks[chain].chain,
//           chainId: chain,
//           balance: parsedTotal.toString(),
//           activeBalance: parsedActiveBalance.toString(),
//           unlockingBalance: parsedUnlockingBalance.toString(),
//           nativeToken: networks[chain].nativeToken,
//           unit: unit || networks[chain].nativeToken,
//           state: APIItemState.READY
//         } as StakingItem;
//       } else {
//         stakingItem = {
//           name: networks[chain].chain,
//           chainId: chain,
//           balance: parsedTotal.toString(),
//           activeBalance: parsedActiveBalance.toString(),
//           unlockingBalance: parsedUnlockingBalance.toString(),
//           nativeToken: networks[chain].nativeToken,
//           unit: unit || networks[chain].nativeToken,
//           state: APIItemState.READY
//         } as StakingItem;
//       }
//
//       // eslint-disable-next-line node/no-callback-literal
//       callback(chain, stakingItem);
//     }
//   });
// }
