// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { APIItemState, ApiProps, NetworkJson, StakingItem, StakingRewardItem, StakingType } from '@subwallet/extension-base/background/KoniTypes';
import { CHAIN_TYPES } from '@subwallet/extension-koni-base/api/bonding';
import { getAllSubsquidStaking } from '@subwallet/extension-koni-base/api/staking/subsquidStaking';
import { IGNORE_GET_SUBSTRATE_FEATURES_LIST } from '@subwallet/extension-koni-base/constants';
import { categoryAddresses, reformatAddress, toUnit } from '@subwallet/extension-koni-base/utils';

import { Codec } from '@polkadot/types/types';
import { BN, BN_ZERO } from '@polkadot/util';
import { isEthereumAddress } from '@polkadot/util-crypto';

interface LedgerData {
  active: string,
  claimedRewards: string[],
  stash: string,
  total: string,
  unlocking: Record<string, string>[]
}

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

export function stakingOnChainApi (addresses: string[], dotSamaAPIMap: Record<string, ApiProps>, callback: (networkKey: string, rs: StakingItem) => void, networks: Record<string, NetworkJson>) {
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

    if (CHAIN_TYPES.amplitude.includes(chain)) {
      const unsub = await getAmplitudeStakingOnChain(parentApi, useAddresses, networks, chain, callback);

      unsubList.push(unsub);
    } else if (CHAIN_TYPES.astar.includes(chain)) {
      const unsub = await getAstarStakingOnChain(parentApi, useAddresses, networks, chain, callback);

      unsubList.push(unsub);
    } else if (CHAIN_TYPES.para.includes(chain)) {
      const unsub = await getParaStakingOnChain(parentApi, useAddresses, networks, chain, callback);

      unsubList.push(unsub);
    } else if (CHAIN_TYPES.relay.includes(chain)) {
      const unsub = await getRelayStakingOnChain(parentApi, useAddresses, networks, chain, callback);

      unsubList.push(unsub);
    }

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

function getAmplitudeStakingOnChain (parentApi: ApiProps, useAddresses: string[], networks: Record<string, NetworkJson>, chain: string, callback: (networkKey: string, rs: StakingItem) => void) {
  return parentApi.api.query.parachainStaking.delegatorState.multi(useAddresses, async (ledgers: Codec[]) => {
    if (ledgers) {
      const _unstakingStates = await parentApi.api.query.parachainStaking.unstaking.multi(useAddresses);

      for (let i = 0; i < ledgers.length; i++) {
        const ledger = ledgers[i];
        const _unstakingData = _unstakingStates[i].toHuman() as Record<string, string> | null;
        const owner = reformatAddress(useAddresses[i], 42);
        const _stakingData = ledger.toHuman() as Record<string, string> | null;
        let _activeBalance = '0';

        if (_stakingData !== null) {
          _activeBalance = _stakingData.amount || _stakingData.total;

          _activeBalance = _activeBalance.replaceAll(',', '');
        }

        const activeBalance = new BN(_activeBalance);
        let unstakingBalance = BN_ZERO;

        if (_unstakingData !== null) {
          Object.values(_unstakingData).forEach((_unstakingAmount) => {
            const bnUnstakingAmount = new BN(_unstakingAmount.replaceAll(',', ''));

            unstakingBalance = unstakingBalance.add(bnUnstakingAmount);
          });
        }

        const totalBalance = activeBalance.add(unstakingBalance);

        const formattedTotalBalance = parseFloat(totalBalance.toString());
        const formattedActiveBalance = parseFloat(activeBalance.toString());
        const formattedUnstakingBalance = parseFloat(unstakingBalance.toString());

        const parsedTotalBalance = parseStakingBalance(formattedTotalBalance, chain, networks);
        const parsedUnstakingBalance = parseStakingBalance(formattedUnstakingBalance, chain, networks);
        const parsedActiveBalance = parseStakingBalance(formattedActiveBalance, chain, networks);

        const stakingItem = {
          name: networks[chain].chain,
          chain: chain,
          balance: parsedTotalBalance.toString(),
          activeBalance: parsedActiveBalance.toString(),
          unlockingBalance: parsedUnstakingBalance.toString(),
          nativeToken: networks[chain].nativeToken,
          unit: networks[chain].nativeToken,
          state: APIItemState.READY,
          type: StakingType.NOMINATED,
          address: owner
        } as StakingItem;

        callback(chain, stakingItem);
      }
    }
  });
}

function getParaStakingOnChain (parentApi: ApiProps, useAddresses: string[], networks: Record<string, NetworkJson>, chain: string, callback: (networkKey: string, rs: StakingItem) => void) {
  return parentApi.api.query.parachainStaking.delegatorState.multi(useAddresses, (ledgers: Codec[]) => {
    if (ledgers) {
      for (let i = 0; i < ledgers.length; i++) {
        const ledger = ledgers[i];
        const owner = reformatAddress(useAddresses[i], 42);
        const data = ledger.toHuman() as Record<string, any> | null;

        if (data !== null) {
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

          callback(chain, stakingItem);
        } else {
          const stakingItem = {
            name: networks[chain].chain,
            chain: chain,
            balance: '0',
            activeBalance: '0',
            unlockingBalance: '0',
            nativeToken: networks[chain].nativeToken,
            unit: networks[chain].nativeToken,
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

function getRelayStakingOnChain (parentApi: ApiProps, useAddresses: string[], networks: Record<string, NetworkJson>, chain: string, callback: (networkKey: string, rs: StakingItem) => void) {
  return parentApi.api.query.staking?.ledger.multi(useAddresses, (ledgers: Codec[]) => {
    let unit = '';

    if (ledgers) {
      for (let i = 0; i < ledgers.length; i++) {
        const ledger = ledgers[i];
        const owner = reformatAddress(useAddresses[i], 42) || undefined;
        const data = ledger.toHuman() as unknown as LedgerData;

        if (data && data.active) {
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
        } else {
          const stakingItem = {
            name: networks[chain].chain,
            chain: chain,
            balance: '0',
            activeBalance: '0',
            unlockingBalance: '0',
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
        const owner = reformatAddress(useAddresses[i], 42);
        const data = ledger.toHuman() as Record<string, any>;

        if (data !== null) {
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
        } else {
          const stakingItem = {
            name: networks[chain].chain,
            chain: chain,
            balance: '0',
            activeBalance: '0',
            unlockingBalance: '0',
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

async function getNominationPoolReward (addresses: string[], networkMap: Record<string, NetworkJson>, dotSamaApiMap: Record<string, ApiProps>): Promise<StakingRewardItem[]> {
  const targetNetworks: string[] = [];
  const validAddresses: string[] = [];

  Object.keys(networkMap).forEach((key) => {
    targetNetworks.push(key);
  });

  addresses.forEach((address) => {
    if (!isEthereumAddress(address)) {
      validAddresses.push(address);
    }
  });

  const rewardList: StakingRewardItem[] = [];

  try {
    await Promise.all(targetNetworks.map(async (networkKey) => {
      const apiProps = await dotSamaApiMap[networkKey].isReady;

      await Promise.all(validAddresses.map(async (address) => {
        const _unclaimedReward = await apiProps.api.call?.nominationPoolsApi?.pendingRewards(address);

        if (_unclaimedReward) {
          const unclaimedReward = _unclaimedReward.toString();
          const parsedUnclaimedReward = toUnit(parseFloat(unclaimedReward), networkMap[networkKey].decimals as number);

          rewardList.push({
            address: address,
            chain: networkKey,
            unclaimedReward: parsedUnclaimedReward.toString(),
            name: networkMap[networkKey].chain,
            state: APIItemState.READY,
            type: StakingType.POOLED
          });
        }
      }));
    }));
  } catch (e) {
    console.error('Error fetching unclaimed reward for nomination pool', e);

    return rewardList;
  }

  return rewardList;
}

export async function getNominationStakingRewardData (addresses: string[], networkMap: Record<string, NetworkJson>): Promise<StakingRewardItem[]> {
  const activeNetworks: string[] = [];

  Object.keys(networkMap).forEach((key) => {
    activeNetworks.push(key);
  });

  if (activeNetworks.length === 0) {
    return [];
  }

  return await getAllSubsquidStaking(addresses, activeNetworks);
}

export async function getPoolingStakingRewardData (addresses: string[], networkMap: Record<string, NetworkJson>, dotSamaApiMap: Record<string, ApiProps>): Promise<StakingRewardItem[]> {
  const activeNetworks: string[] = [];

  Object.keys(networkMap).forEach((key) => {
    activeNetworks.push(key);
  });

  if (activeNetworks.length === 0) {
    return [];
  }

  return await getNominationPoolReward(addresses, networkMap, dotSamaApiMap);
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
