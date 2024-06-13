// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { APIItemState, NominatorMetadata, StakingItem, StakingRewardItem, StakingType } from '@subwallet/extension-base/background/KoniTypes';
import { PalletNominationPoolsPoolMember } from '@subwallet/extension-base/core/substrate/nominationpools-pallet';
import { PalletStakingStakingLedger, subscribeRelayChainNominatorMetadata, subscribeRelayChainPoolMemberMetadata } from '@subwallet/extension-base/koni/api/staking/bonding/relayChain';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getChainNativeTokenBasicInfo } from '@subwallet/extension-base/services/chain-service/utils';
import { EarningStatus } from '@subwallet/extension-base/types';
import { reformatAddress } from '@subwallet/extension-base/utils';

import { Codec } from '@polkadot/types/types';
import { BN } from '@polkadot/util';
import { isEthereumAddress } from '@polkadot/util-crypto';

export function getRelayStakingOnChain (substrateApi: _SubstrateApi, useAddresses: string[], chainInfoMap: Record<string, _ChainInfo>, chain: string, stakingCallback: (networkKey: string, rs: StakingItem) => void, nominatorStateCallback: (rs: NominatorMetadata) => void) {
  const { symbol } = _getChainNativeTokenBasicInfo(chainInfoMap[chain]);

  return substrateApi.api.query.staking?.ledger.multi(useAddresses, async (ledgers: Codec[]) => {
    if (ledgers) {
      await Promise.all(ledgers.map(async (_ledger: Codec, i) => {
        const owner = reformatAddress(useAddresses[i], 42);
        const ledger = _ledger.toPrimitive() as unknown as PalletStakingStakingLedger;

        if (ledger) {
          const _totalBalance = ledger.total.toString();
          const _activeBalance = ledger.active.toString();
          const bnUnlockingBalance = new BN(_totalBalance).sub(new BN(_activeBalance));

          stakingCallback(chain, {
            name: chainInfoMap[chain].name,
            chain: chain,
            balance: _totalBalance,
            activeBalance: _activeBalance,
            unlockingBalance: bnUnlockingBalance.toString(),
            nativeToken: symbol,
            unit: symbol,
            state: APIItemState.READY,
            type: StakingType.NOMINATED,
            address: owner
          } as StakingItem);

          const nominatorMetadata = await subscribeRelayChainNominatorMetadata(chainInfoMap[chain], owner, substrateApi, ledger);

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
            status: EarningStatus.NOT_STAKING,
            address: owner,
            activeStake: '0',
            nominations: [],
            unstakings: []
          } as NominatorMetadata);
        }
      }));
    }
  });
}

export function getRelayPoolingOnChain (substrateApi: _SubstrateApi, useAddresses: string[], chainInfoMap: Record<string, _ChainInfo>, chain: string, stakingCallback: (networkKey: string, rs: StakingItem) => void, nominatorStateCallback: (rs: NominatorMetadata) => void) {
  const { symbol } = _getChainNativeTokenBasicInfo(chainInfoMap[chain]);

  return substrateApi.api.query?.nominationPools?.poolMembers.multi(useAddresses, async (ledgers: Codec[]) => {
    if (ledgers) {
      await Promise.all(ledgers.map(async (_poolMemberInfo, i) => {
        const poolMemberInfo = _poolMemberInfo.toPrimitive() as unknown as PalletNominationPoolsPoolMember;
        const owner = reformatAddress(useAddresses[i], 42);

        if (poolMemberInfo) {
          const bondedBalance = poolMemberInfo.points;
          const unbondedBalance = poolMemberInfo.unbondingEras;

          let unlockingBalance = new BN(0);
          const bnBondedBalance = new BN(bondedBalance.toString());

          Object.entries(unbondedBalance).forEach(([, value]) => {
            const bnUnbondedBalance = new BN(value.toString());

            unlockingBalance = unlockingBalance.add(bnUnbondedBalance);
          });

          const totalBalance = bnBondedBalance.add(unlockingBalance);

          stakingCallback(chain, {
            name: chainInfoMap[chain].name,
            chain: chain,
            balance: totalBalance.toString(),
            activeBalance: bnBondedBalance.toString(),
            unlockingBalance: unlockingBalance.toString(),
            nativeToken: symbol,
            unit: symbol,
            state: APIItemState.READY,
            type: StakingType.POOLED,
            address: owner
          } as StakingItem);

          const nominatorMetadata = await subscribeRelayChainPoolMemberMetadata(chainInfoMap[chain], owner, substrateApi, poolMemberInfo);

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
            type: StakingType.POOLED,
            address: owner
          } as StakingItem);

          nominatorStateCallback({
            chain,
            type: StakingType.POOLED,
            address: owner,
            status: EarningStatus.NOT_STAKING,
            activeStake: '0',
            nominations: [], // can only join 1 pool at a time
            unstakings: []
          } as NominatorMetadata);
        }
      }));
    }
  });
}

export async function getNominationPoolReward (addresses: string[], chainInfoMap: Record<string, _ChainInfo>, substrateApiMap: Record<string, _SubstrateApi>, callBack: (rs: StakingRewardItem) => void) {
  const targetNetworks: string[] = [];
  const validAddresses: string[] = [];

  Object.keys(chainInfoMap).forEach((key) => {
    targetNetworks.push(key);
  });

  addresses.forEach((address) => {
    if (!isEthereumAddress(address)) {
      validAddresses.push(address);
    }
  });

  try {
    await Promise.all(targetNetworks.map(async (networkKey) => {
      const substrateApi = await substrateApiMap[networkKey].isReady;

      if (substrateApi.api.call.nominationPoolsApi) {
        await Promise.all(validAddresses.map(async (address) => {
          const _unclaimedReward = await substrateApi.api.call?.nominationPoolsApi?.pendingRewards(address);

          if (_unclaimedReward) {
            callBack({
              address: address,
              chain: networkKey,
              unclaimedReward: _unclaimedReward.toString(),
              name: chainInfoMap[networkKey].name,
              state: APIItemState.READY,
              type: StakingType.POOLED
            });
          }
        }));
      }
    }));
  } catch (e) {
    console.debug(e);
  }
}
