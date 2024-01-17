// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { APIItemState, NominatorMetadata, StakingItem, StakingRewardItem, StakingType } from '@subwallet/extension-base/background/KoniTypes';
import { subscribeAmplitudeNominatorMetadata } from '@subwallet/extension-base/koni/api/staking/bonding/amplitude';
import { subscribeAstarNominatorMetadata } from '@subwallet/extension-base/koni/api/staking/bonding/astar';
import { subscribeParaChainNominatorMetadata } from '@subwallet/extension-base/koni/api/staking/bonding/paraChain';
import { PalletDappsStakingAccountLedger, PalletParachainStakingDelegator, ParachainStakingStakeOption } from '@subwallet/extension-base/koni/api/staking/bonding/utils';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getChainNativeTokenBasicInfo } from '@subwallet/extension-base/services/chain-service/utils';
import { _STAKING_CHAIN_GROUP } from '@subwallet/extension-base/services/earning-service/constants';
import { EarningStatus } from '@subwallet/extension-base/types';
import { reformatAddress } from '@subwallet/extension-base/utils';

import { Codec } from '@polkadot/types/types';
import { BN, BN_ZERO } from '@polkadot/util';
import { isEthereumAddress } from '@polkadot/util-crypto';

function getSingleStakingAmplitude (substrateApi: _SubstrateApi, address: string, chainInfoMap: Record<string, _ChainInfo>, chain: string, stakingCallback: (networkKey: string, rs: StakingItem) => void, nominatorStateCallback: (nominatorMetadata: NominatorMetadata) => void) {
  return substrateApi.api.queryMulti([
    [substrateApi.api.query.parachainStaking.delegatorState, address],
    [substrateApi.api.query.parachainStaking.unstaking, address]
  ], async ([_delegatorState, _unstaking]) => {
    const delegatorState = _delegatorState.toPrimitive() as unknown as ParachainStakingStakeOption;
    const unstakingInfo = _unstaking.toPrimitive() as unknown as Record<string, number>;
    const { symbol } = _getChainNativeTokenBasicInfo(chainInfoMap[chain]);
    const owner = reformatAddress(address, 42);

    if (!delegatorState && !unstakingInfo) {
      stakingCallback(chain, {
        name: chainInfoMap[chain].name,
        chain: chain,
        balance: '0',
        activeBalance: '0',
        unlockingBalance: '0',
        nativeToken: symbol,
        unit: symbol,
        state: APIItemState.READY,
        type: StakingType.NOMINATED,
        address: owner
      } as StakingItem);

      nominatorStateCallback({
        chain,
        type: StakingType.NOMINATED,
        address: owner,
        status: EarningStatus.NOT_STAKING,
        activeStake: '0',
        nominations: [],
        unstakings: []
      } as NominatorMetadata);
    } else {
      const activeBalance = delegatorState ? new BN(delegatorState.amount.toString()) : BN_ZERO;
      let unstakingBalance = BN_ZERO;

      if (unstakingInfo) {
        Object.values(unstakingInfo).forEach((unstakingAmount) => {
          const bnUnstakingAmount = new BN(unstakingAmount.toString());

          unstakingBalance = unstakingBalance.add(bnUnstakingAmount);
        });
      }

      const totalBalance = activeBalance.add(unstakingBalance);

      const stakingItem = {
        name: chainInfoMap[chain].name,
        chain: chain,
        balance: totalBalance.toString(),
        activeBalance: activeBalance.toString(),
        unlockingBalance: unstakingBalance.toString(),
        nativeToken: symbol,
        unit: symbol,
        state: APIItemState.READY,
        type: StakingType.NOMINATED,
        address: owner
      } as StakingItem;

      stakingCallback(chain, stakingItem);

      const nominatorMetadata = await subscribeAmplitudeNominatorMetadata(chainInfoMap[chain], owner, substrateApi, delegatorState, unstakingInfo);

      nominatorStateCallback(nominatorMetadata);
    }
  });
}

function getMultiStakingAmplitude (substrateApi: _SubstrateApi, useAddresses: string[], chainInfoMap: Record<string, _ChainInfo>, chain: string, stakingCallback: (networkKey: string, rs: StakingItem) => void, nominatorStateCallback: (nominatorMetadata: NominatorMetadata) => void) {
  return substrateApi.api.query.parachainStaking.delegatorState.multi(useAddresses, async (ledgers: Codec[]) => {
    if (ledgers) {
      const { symbol } = _getChainNativeTokenBasicInfo(chainInfoMap[chain]);
      const _unstakingStates = await substrateApi.api.query.parachainStaking.unstaking.multi(useAddresses);

      await Promise.all(ledgers.map(async (_delegatorState, i) => {
        const owner = reformatAddress(useAddresses[i], 42);
        const delegatorState = _delegatorState.toPrimitive() as unknown as ParachainStakingStakeOption;
        const unstakingInfo = _unstakingStates[i].toPrimitive() as unknown as Record<string, number>;

        if (!delegatorState && !unstakingInfo) {
          stakingCallback(chain, {
            name: chainInfoMap[chain].name,
            chain: chain,
            balance: '0',
            activeBalance: '0',
            unlockingBalance: '0',
            nativeToken: symbol,
            unit: symbol,
            state: APIItemState.READY,
            type: StakingType.NOMINATED,
            address: owner
          } as StakingItem);

          nominatorStateCallback({
            chain,
            type: StakingType.NOMINATED,
            address: owner,
            status: EarningStatus.NOT_STAKING,
            activeStake: '0',
            nominations: [],
            unstakings: []
          } as NominatorMetadata);
        } else {
          const activeBalance = delegatorState ? new BN(delegatorState.amount.toString()) : BN_ZERO;
          let unstakingBalance = BN_ZERO;

          if (unstakingInfo) {
            Object.values(unstakingInfo).forEach((unstakingAmount) => {
              const bnUnstakingAmount = new BN(unstakingAmount.toString());

              unstakingBalance = unstakingBalance.add(bnUnstakingAmount);
            });
          }

          const totalBalance = activeBalance.add(unstakingBalance);

          const stakingItem = {
            name: chainInfoMap[chain].name,
            chain: chain,
            balance: totalBalance.toString(),
            activeBalance: activeBalance.toString(),
            unlockingBalance: unstakingBalance.toString(),
            nativeToken: symbol,
            unit: symbol,
            state: APIItemState.READY,
            type: StakingType.NOMINATED,
            address: owner
          } as StakingItem;

          stakingCallback(chain, stakingItem);

          const nominatorMetadata = await subscribeAmplitudeNominatorMetadata(chainInfoMap[chain], owner, substrateApi, delegatorState, unstakingInfo);

          nominatorStateCallback(nominatorMetadata);
        }
      }));
    }
  });
}

export function getAmplitudeStakingOnChain (parentApi: _SubstrateApi, useAddresses: string[], networks: Record<string, _ChainInfo>, chain: string, callback: (networkKey: string, rs: StakingItem) => void, nominatorStateCallback: (nominatorMetadata: NominatorMetadata) => void) {
  if (useAddresses.length === 1) {
    return getSingleStakingAmplitude(parentApi, useAddresses[0], networks, chain, callback, nominatorStateCallback);
  }

  return getMultiStakingAmplitude(parentApi, useAddresses, networks, chain, callback, nominatorStateCallback);
}

export async function getAmplitudeUnclaimedStakingReward (substrateApiMap: Record<string, _SubstrateApi>, addresses: string[], networks: Record<string, _ChainInfo>, chains: string[], callBack: (rs: StakingRewardItem) => void): Promise<StakingRewardItem[]> {
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
      const apiProps = await substrateApiMap[chain].isReady;

      await Promise.all(useAddresses.map(async (address) => {
        const _unclaimedReward = await apiProps.api.query.parachainStaking.rewards(address);

        callBack({
          chain,
          name: networkInfo.name,
          state: APIItemState.READY,
          type: StakingType.NOMINATED,
          address: reformatAddress(address, 42),
          unclaimedReward: _unclaimedReward.toString()
        } as StakingRewardItem);
      }));
    }
  }));

  return unclaimedRewardList;
}

export function getParaStakingOnChain (substrateApi: _SubstrateApi, useAddresses: string[], chainInfoMap: Record<string, _ChainInfo>, chain: string, stakingCallback: (networkKey: string, rs: StakingItem) => void, nominatorStateCallback: (nominatorMetadata: NominatorMetadata) => void) {
  const { symbol } = _getChainNativeTokenBasicInfo(chainInfoMap[chain]);

  return substrateApi.api.query.parachainStaking.delegatorState.multi(useAddresses, async (ledgers: Codec[]) => {
    if (ledgers) {
      await Promise.all(ledgers.map(async (_delegatorState, i) => {
        const delegatorState = _delegatorState.toPrimitive() as unknown as PalletParachainStakingDelegator;
        const owner = reformatAddress(useAddresses[i], 42);

        if (delegatorState) {
          const _totalBalance = delegatorState.total;
          // let _unlockingBalance = delegatorState.lessTotal ? delegatorState.lessTotal : delegatorState.requests.lessTotal;
          const _unlockingBalance = delegatorState.lessTotal;

          const totalBalance = new BN(_totalBalance.toString());
          const unlockingBalance = new BN(_unlockingBalance.toString());
          const activeBalance = totalBalance.sub(unlockingBalance);

          stakingCallback(chain, {
            name: chainInfoMap[chain].name,
            chain: chain,
            balance: totalBalance.toString(),
            activeBalance: activeBalance.toString(),
            unlockingBalance: unlockingBalance.toString(),
            nativeToken: symbol,
            unit: symbol,
            state: APIItemState.READY,
            type: StakingType.NOMINATED,
            address: owner
          } as StakingItem);

          const nominatorMetadata = await subscribeParaChainNominatorMetadata(chainInfoMap[chain], owner, substrateApi, delegatorState);

          nominatorStateCallback(nominatorMetadata);
        } else {
          stakingCallback(chain, {
            name: chainInfoMap[chain].name,
            chain: chain,
            balance: '0',
            activeBalance: '0',
            unlockingBalance: '0',
            nativeToken: symbol,
            unit: symbol,
            state: APIItemState.READY,
            type: StakingType.NOMINATED,
            address: owner
          } as StakingItem);

          nominatorStateCallback({
            chain,
            type: StakingType.NOMINATED,
            address: owner,
            status: EarningStatus.NOT_STAKING,
            activeStake: '0',
            nominations: [],
            unstakings: []
          } as NominatorMetadata);
        }
      }));
    }
  });
}

export function getAstarStakingOnChain (substrateApi: _SubstrateApi, useAddresses: string[], chainInfoMap: Record<string, _ChainInfo>, chain: string, stakingCallback: (networkKey: string, rs: StakingItem) => void, nominatorStateCallback: (nominatorMetadata: NominatorMetadata) => void) {
  const { symbol } = _getChainNativeTokenBasicInfo(chainInfoMap[chain]);

  return substrateApi.api.query.dappsStaking.ledger.multi(useAddresses, async (ledgers: Codec[]) => {
    if (ledgers) {
      await Promise.all(ledgers.map(async (_ledger, i) => {
        let bnUnlockingBalance = BN_ZERO;
        const owner = reformatAddress(useAddresses[i], 42);

        const ledger = _ledger.toPrimitive() as unknown as PalletDappsStakingAccountLedger;

        if (ledger && ledger.locked > 0) {
          const unlockingChunks = ledger.unbondingInfo.unlockingChunks;
          const _totalStake = ledger.locked;
          const bnTotalStake = new BN(_totalStake.toString());

          for (const chunk of unlockingChunks) {
            const bnChunk = new BN(chunk.amount.toString());

            bnUnlockingBalance = bnUnlockingBalance.add(bnChunk);
          }

          const bnActiveStake = bnTotalStake.sub(bnUnlockingBalance);

          stakingCallback(chain, {
            name: chainInfoMap[chain].name,
            chain: chain,
            balance: bnTotalStake.toString(),
            activeBalance: bnActiveStake.toString(),
            unlockingBalance: bnUnlockingBalance.toString(),
            nativeToken: symbol,
            unit: symbol,
            state: APIItemState.READY,
            type: StakingType.NOMINATED,
            address: owner
          } as StakingItem);

          const nominatorMetadata = await subscribeAstarNominatorMetadata(chainInfoMap[chain], owner, substrateApi, ledger);

          nominatorStateCallback(nominatorMetadata);
        } else {
          stakingCallback(chain, {
            name: chainInfoMap[chain].name,
            chain,
            balance: '0',
            activeBalance: '0',
            unlockingBalance: '0',
            nativeToken: symbol,
            unit: symbol,
            state: APIItemState.READY,
            type: StakingType.NOMINATED,
            address: owner
          } as StakingItem);

          nominatorStateCallback({
            chain,
            type: StakingType.NOMINATED,
            address: owner,
            status: EarningStatus.NOT_STAKING,
            activeStake: '0',
            nominations: [],
            unstakings: []
          } as NominatorMetadata);
        }
      }));
    }
  });
}
