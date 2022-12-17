// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, NetworkJson, StakingItem, StakingRewardItem } from '@subwallet/extension-base/background/KoniTypes';
import { CHAIN_TYPES } from '@subwallet/extension-koni-base/api/bonding';
import { getAmplitudeStakingOnChain, getAstarStakingOnChain, getParaStakingOnChain } from '@subwallet/extension-koni-base/api/staking/paraChain';
import { getNominationPoolReward, getRelayPoolingOnchain, getRelayStakingOnChain } from '@subwallet/extension-koni-base/api/staking/relayChain';
import { getAllSubsquidStaking } from '@subwallet/extension-koni-base/api/staking/subsquidStaking';
import { IGNORE_GET_SUBSTRATE_FEATURES_LIST } from '@subwallet/extension-koni-base/constants';
import { categoryAddresses } from '@subwallet/extension-koni-base/utils';

interface PromiseMapping {
  api: ApiProps,
  chain: string
}

export function stakingOnChainApi (addresses: string[], dotSamaAPIMap: Record<string, ApiProps>, callback: (networkKey: string, rs: StakingItem) => void, networks: Record<string, NetworkJson>) {
  const apiPropsMap: PromiseMapping[] = [];
  const [substrateAddresses, evmAddresses] = categoryAddresses(addresses);

  Object.entries(networks).forEach(([networkKey, networkInfo]) => {
    if (IGNORE_GET_SUBSTRATE_FEATURES_LIST.indexOf(networkKey) < 0 && networkInfo.getStakingOnChain && networkInfo.active) {
      apiPropsMap.push({ chain: networkKey, api: dotSamaAPIMap[networkKey] });
    }
  });

  const unsubList: VoidFunction[] = [];

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  apiPropsMap.forEach(async ({ api: apiPromise, chain }) => {
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

    if (['polkadot', 'kusama', 'westend', 'alephTest', 'aleph'].includes(chain)) {
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
