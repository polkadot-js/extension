// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { APIItemState, ApiProps, NetworkJson, StakingItem } from '@subwallet/extension-base/background/KoniTypes';
import { handleAstarUnlockingInfo } from '@subwallet/extension-koni-base/api/bonding/astar';
import { handleParaUnlockingInfo } from '@subwallet/extension-koni-base/api/bonding/paraChain';
import { handleRelayUnlockingInfo } from '@subwallet/extension-koni-base/api/bonding/relayChain';
import { PREDEFINED_NETWORKS } from '@subwallet/extension-koni-base/api/predefinedNetworks';
import { IGNORE_GET_SUBSTRATE_FEATURES_LIST } from '@subwallet/extension-koni-base/constants';
import { categoryAddresses, toUnit } from '@subwallet/extension-koni-base/utils/utils';

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

    if (['astar', 'shiden', 'shibuya'].includes(chain)) {
      return getAstarStakingOnChain(parentApi, useAddresses, networks, chain, callback);
    } else if (['darwinia', 'crab', 'pangolin'].includes(chain)) {
      return getDarwiniaStakingOnChain(parentApi, useAddresses, networks, chain, callback);
    } else if (['moonbeam', 'moonriver', 'moonbase', 'turing', 'turingStaging', 'bifrost', 'bifrost_testnet'].includes(chain)) {
      return getParaStakingOnChain(parentApi, useAddresses, networks, chain, callback);
    }

    return getRelayStakingOnChain(parentApi, useAddresses, networks, chain, callback);
  }));
}

function getParaStakingOnChain (parentApi: ApiProps, useAddresses: string[], networks: Record<string, NetworkJson>, chain: string, callback: (networkKey: string, rs: StakingItem) => void) {
  return parentApi.api.query.parachainStaking.delegatorState.multi(useAddresses, async (ledgers: any) => {
    let totalBalance = new BN(0);
    let unlockingBalance = new BN(0);
    let stakingItem: StakingItem;

    if (ledgers) {
      for (const ledger of ledgers) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        const data = ledger.toHuman() as Record<string, any> | null;

        if (data !== null) {
          let _totalBalance = data.total as string;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          let _unlockingBalance = data.lessTotal ? data.lessTotal as string : data.requests.lessTotal as string;

          _totalBalance = _totalBalance.replaceAll(',', '');
          _unlockingBalance = _unlockingBalance.replaceAll(',', '');

          const bnTotalBalance = new BN(_totalBalance);
          const bnUnlockingBalance = new BN(_unlockingBalance);

          totalBalance = totalBalance.add(bnTotalBalance);
          unlockingBalance = unlockingBalance.add(bnUnlockingBalance);
        }
      }

      const formattedTotalBalance = parseFloat(totalBalance.toString());
      const formattedActiveBalance = parseFloat(totalBalance.sub(unlockingBalance).toString());
      const formattedUnlockingBalance = parseFloat(unlockingBalance.toString());

      const parsedTotalBalance = parseStakingBalance(formattedTotalBalance, chain, networks);
      const parsedUnlockingBalance = parseStakingBalance(formattedUnlockingBalance, chain, networks);
      const parsedActiveBalance = parseStakingBalance(formattedActiveBalance, chain, networks);

      const unlockingInfo = await handleParaUnlockingInfo(parentApi, networks[chain], chain, useAddresses[0]);

      if (totalBalance.gt(BN_ZERO)) {
        stakingItem = {
          name: networks[chain].chain,
          chainId: chain,
          balance: parsedTotalBalance.toString(),
          activeBalance: parsedActiveBalance.toString(),
          unlockingBalance: parsedUnlockingBalance.toString(),
          nativeToken: networks[chain].nativeToken,
          unit: networks[chain].nativeToken,
          state: APIItemState.READY,
          unlockingInfo
        } as StakingItem;
      } else {
        stakingItem = {
          name: networks[chain].chain,
          chainId: chain,
          balance: parsedTotalBalance.toString(),
          activeBalance: parsedActiveBalance.toString(),
          unlockingBalance: parsedUnlockingBalance.toString(),
          nativeToken: networks[chain].nativeToken,
          unit: networks[chain].nativeToken,
          state: APIItemState.READY,
          unlockingInfo
        } as StakingItem;
      }

      // eslint-disable-next-line node/no-callback-literal
      callback(chain, stakingItem);
    }
  });
}

function getRelayStakingOnChain (parentApi: ApiProps, useAddresses: string[], networks: Record<string, NetworkJson>, chain: string, callback: (networkKey: string, rs: StakingItem) => void) {
  return parentApi.api.query.staking?.ledger.multi(useAddresses, async (ledgers: any[]) => {
    let totalBalance = new BN(0);
    let activeBalance = new BN(0);
    let unlockingBalance = new BN(0);
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
            const bnUnlockingBalance = new BN(_unlockingBalance);

            unlockingBalance = unlockingBalance.add(bnUnlockingBalance);
          });

          let amount = _totalBalance ? _totalBalance.split(' ')[0] : '';

          amount = amount.replaceAll(',', '');
          unit = _totalBalance ? _totalBalance.split(' ')[1] : '';
          const bnTotalBalance = new BN(amount);

          totalBalance = totalBalance.add(bnTotalBalance);

          amount = _activeBalance ? _activeBalance.split(' ')[0] : '';
          amount = amount.replaceAll(',', '');
          unit = _activeBalance ? _activeBalance.split(' ')[1] : '';
          const bnActiveBalance = new BN(amount);

          activeBalance = activeBalance.add(bnActiveBalance);
        }
      }

      const formattedTotalBalance = parseFloat(totalBalance.toString());
      const formattedActiveBalance = parseFloat(activeBalance.toString());
      const formattedUnlockingBalance = parseFloat(unlockingBalance.toString());

      const parsedActiveBalance = parseStakingBalance(formattedActiveBalance, chain, networks);
      const parsedUnlockingBalance = parseStakingBalance(formattedUnlockingBalance, chain, networks);
      const parsedTotal = parseStakingBalance(formattedTotalBalance, chain, networks);

      const unlockingInfo = await handleRelayUnlockingInfo(parentApi, networks[chain], chain, useAddresses[0]);

      if (totalBalance.gt(BN_ZERO)) {
        stakingItem = {
          name: networks[chain].chain,
          chainId: chain,
          balance: parsedTotal.toString(),
          activeBalance: parsedActiveBalance.toString(),
          unlockingBalance: parsedUnlockingBalance.toString(),
          nativeToken: networks[chain].nativeToken,
          unit: unit || networks[chain].nativeToken,
          state: APIItemState.READY,
          unlockingInfo
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
          state: APIItemState.READY,
          unlockingInfo
        } as StakingItem;
      }

      // eslint-disable-next-line node/no-callback-literal
      callback(chain, stakingItem);
    }
  });
}

function getAstarStakingOnChain (parentApi: ApiProps, useAddresses: string[], networks: Record<string, NetworkJson>, chain: string, callback: (networkKey: string, rs: StakingItem) => void) {
  return parentApi.api.query.dappsStaking.ledger.multi(useAddresses, async (ledgers: any[]) => {
    let totalBalance = BN_ZERO;
    let unlockingBalance = BN_ZERO;
    let stakingItem: StakingItem;

    if (ledgers) {
      for (const ledger of ledgers) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        const data = ledger.toHuman() as Record<string, any>;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const unlockingChunks = data.unbondingInfo.unlockingChunks as Record<string, string>[];
        const _totalStake = data.locked as string;

        for (const chunk of unlockingChunks) {
          const bnChunk = new BN(chunk.amount.replaceAll(',', ''));

          unlockingBalance = unlockingBalance.add(bnChunk);
        }

        const bnTotalStake = new BN(_totalStake.replaceAll(',', ''));

        totalBalance = totalBalance.add(bnTotalStake);
      }

      const formattedTotalBalance = parseFloat(totalBalance.toString());
      const formattedActiveBalance = parseFloat(totalBalance.sub(unlockingBalance).toString());
      const formattedUnlockingBalance = parseFloat(unlockingBalance.toString());

      const parsedTotalBalance = parseStakingBalance(formattedTotalBalance, chain, networks);
      const parsedActiveBalance = parseStakingBalance(formattedActiveBalance, chain, networks);
      const parsedUnlockingBalance = parseStakingBalance(formattedUnlockingBalance, chain, networks);

      const unlockingInfo = await handleAstarUnlockingInfo(parentApi, networks[chain], chain, useAddresses[0]);

      if (totalBalance.gt(BN_ZERO)) {
        stakingItem = {
          name: networks[chain].chain,
          chainId: chain,
          balance: parsedTotalBalance.toString(),
          activeBalance: parsedActiveBalance.toString(),
          unlockingBalance: parsedUnlockingBalance.toString(),
          nativeToken: networks[chain].nativeToken,
          unit: networks[chain].nativeToken,
          state: APIItemState.READY,
          unlockingInfo
        } as StakingItem;
      } else {
        stakingItem = {
          name: networks[chain].chain,
          chainId: chain,
          balance: parsedTotalBalance.toString(),
          activeBalance: parsedActiveBalance.toString(),
          unlockingBalance: parsedUnlockingBalance.toString(),
          nativeToken: networks[chain].nativeToken,
          unit: networks[chain].nativeToken,
          state: APIItemState.READY,
          unlockingInfo
        } as StakingItem;
      }

      // eslint-disable-next-line node/no-callback-literal
      callback(chain, stakingItem);
    }
  });
}

function getDarwiniaStakingOnChain (parentApi: ApiProps, useAddresses: string[], networks: Record<string, NetworkJson>, chain: string, callback: (networkKey: string, rs: StakingItem) => void) {
  return parentApi.api.query.staking?.ledger.multi(useAddresses, (ledgers: any[]) => {
    let totalBalance = 0;
    let activeBalance = 0;
    let unlockingBalance = 0;
    const unit = '';
    let stakingItem: StakingItem;
    // TODO: get unstakable amount based on timestamp
    // const timestamp = new Date().getTime();

    if (ledgers) {
      for (const ledger of ledgers) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        const data = ledger.toHuman() as unknown as Record<string, any>;

        if (data && data.active) {
          // locked balance
          const _ringLockStaking = data.ringStakingLock as Record<string, any>;
          const unbondingLockBalance = _ringLockStaking.unbondings as Record<string, string>[];
          let _totalActive = data.active as string;

          unbondingLockBalance.forEach((item) => {
            const _unlockingBalance = item.amount.replaceAll(',', '');

            unlockingBalance += parseFloat(_unlockingBalance);
          });

          _totalActive = _totalActive.replaceAll(',', '');
          activeBalance += parseFloat(_totalActive);

          const _totalBalance = activeBalance + unlockingBalance;

          totalBalance += _totalBalance;
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
