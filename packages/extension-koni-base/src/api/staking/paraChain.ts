// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { APIItemState, StakingItem, StakingRewardItem, StakingType } from '@subwallet/extension-base/background/KoniTypes';
import { _STAKING_CHAIN_GROUP } from '@subwallet/extension-base/services/chain-service/constants';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getChainNativeTokenBasicInfo } from '@subwallet/extension-base/services/chain-service/utils';
import { parseStakingBalance } from '@subwallet/extension-koni-base/api/staking/utils';
import { reformatAddress } from '@subwallet/extension-koni-base/utils';

import { Codec } from '@polkadot/types/types';
import { BN, BN_ZERO } from '@polkadot/util';
import { isEthereumAddress } from '@polkadot/util-crypto';

function getSingleStakingAmplitude (parentApi: _SubstrateApi, address: string, networks: Record<string, _ChainInfo>, chain: string, callback: (networkKey: string, rs: StakingItem) => void) {
  return parentApi.api.queryMulti([
    [parentApi.api.query.parachainStaking.delegatorState, address],
    [parentApi.api.query.parachainStaking.unstaking, address]
  ], ([_delegatorState, _unstaking]) => {
    const _stakingData = _delegatorState.toHuman() as Record<string, string> | null;
    const _unstakingData = _unstaking.toHuman() as Record<string, string> | null;
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

    const { symbol } = _getChainNativeTokenBasicInfo(networks[chain]);

    const stakingItem = {
      name: networks[chain].name,
      chain: chain,
      balance: parsedTotalBalance.toString(),
      activeBalance: parsedActiveBalance.toString(),
      unlockingBalance: parsedUnstakingBalance.toString(),
      nativeToken: symbol,
      unit: symbol,
      state: APIItemState.READY,
      type: StakingType.NOMINATED,
      address
    } as StakingItem;

    callback(chain, stakingItem);
  });
}

function getMultiStakingAmplitude (parentApi: _SubstrateApi, useAddresses: string[], networks: Record<string, _ChainInfo>, chain: string, callback: (networkKey: string, rs: StakingItem) => void) {
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

        const { symbol } = _getChainNativeTokenBasicInfo(networks[chain]);

        const stakingItem = {
          name: networks[chain].name,
          chain: chain,
          balance: parsedTotalBalance.toString(),
          activeBalance: parsedActiveBalance.toString(),
          unlockingBalance: parsedUnstakingBalance.toString(),
          nativeToken: symbol,
          unit: symbol,
          state: APIItemState.READY,
          type: StakingType.NOMINATED,
          address: owner
        } as StakingItem;

        callback(chain, stakingItem);
      }
    }
  });
}

export function getAmplitudeStakingOnChain (parentApi: _SubstrateApi, useAddresses: string[], networks: Record<string, _ChainInfo>, chain: string, callback: (networkKey: string, rs: StakingItem) => void) {
  if (useAddresses.length === 1) {
    return getSingleStakingAmplitude(parentApi, useAddresses[0], networks, chain, callback);
  }

  return getMultiStakingAmplitude(parentApi, useAddresses, networks, chain, callback);
}

export async function getAmplitudeUnclaimedStakingReward (substrateApiMap: Record<string, _SubstrateApi>, addresses: string[], networks: Record<string, _ChainInfo>, chains: string[]): Promise<StakingRewardItem[]> {
  if (chains.length === 0) {
    return [];
  }

  const useAddresses: string[] = [];

  addresses.forEach((address) => {
    if (!isEthereumAddress(address)) {
      useAddresses.push(address);
    }
  });

  const unclaimedRewardList: StakingRewardItem[] = [];

  await Promise.all(chains.map(async (chain) => {
    if (_STAKING_CHAIN_GROUP.amplitude.includes(chain) && !_STAKING_CHAIN_GROUP.kilt.includes(chain)) {
      const networkInfo = networks[chain];
      const { decimals } = _getChainNativeTokenBasicInfo(networkInfo);
      const apiProps = await substrateApiMap[chain].isReady;

      await Promise.all(useAddresses.map(async (address) => {
        const _unclaimedReward = await apiProps.api.query.parachainStaking.rewards(address);

        const unclaimedReward = _unclaimedReward.toString();

        const rewardItem = {
          chain,
          name: networkInfo.name,
          state: APIItemState.READY,
          type: StakingType.NOMINATED,
          address: reformatAddress(address, 42)
        } as StakingRewardItem;

        const parsedUnclaimedReward = parseFloat(unclaimedReward) / (10 ** decimals);

        rewardItem.unclaimedReward = parsedUnclaimedReward.toString();

        unclaimedRewardList.push(rewardItem);
      }));
    }
  }));

  return unclaimedRewardList;
}

export function getParaStakingOnChain (parentApi: _SubstrateApi, useAddresses: string[], networks: Record<string, _ChainInfo>, chain: string, callback: (networkKey: string, rs: StakingItem) => void) {
  const { symbol } = _getChainNativeTokenBasicInfo(networks[chain]);

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
            name: networks[chain].name,
            chain: chain,
            balance: parsedTotalBalance.toString(),
            activeBalance: parsedActiveBalance.toString(),
            unlockingBalance: parsedUnlockingBalance.toString(),
            nativeToken: symbol,
            unit: symbol,
            state: APIItemState.READY,
            type: StakingType.NOMINATED,
            address: owner
          } as StakingItem;

          callback(chain, stakingItem);
        } else {
          const stakingItem = {
            name: networks[chain].name,
            chain: chain,
            balance: '0',
            activeBalance: '0',
            unlockingBalance: '0',
            nativeToken: symbol,
            unit: symbol,
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

export function getAstarStakingOnChain (parentApi: _SubstrateApi, useAddresses: string[], networks: Record<string, _ChainInfo>, chain: string, callback: (networkKey: string, rs: StakingItem) => void) {
  const { symbol } = _getChainNativeTokenBasicInfo(networks[chain]);

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
          name: networks[chain].name,
          chain: chain,
          balance: parsedTotalBalance.toString(),
          activeBalance: parsedActiveBalance.toString(),
          unlockingBalance: parsedUnlockingBalance.toString(),
          nativeToken: symbol,
          unit: symbol,
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
