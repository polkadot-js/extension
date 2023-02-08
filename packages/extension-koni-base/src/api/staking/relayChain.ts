// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { APIItemState, StakingItem, StakingRewardItem, StakingType } from '@subwallet/extension-base/background/KoniTypes';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getChainNativeTokenBasicInfo } from '@subwallet/extension-base/services/chain-service/utils';
import { reformatAddress } from '@subwallet/extension-koni-base/utils';

import { Codec } from '@polkadot/types/types';
import { BN } from '@polkadot/util';
import { isEthereumAddress } from '@polkadot/util-crypto';

interface LedgerData {
  active: string,
  claimedRewards: string[],
  stash: string,
  total: string,
  unlocking: Record<string, string>[]
}

export function getRelayStakingOnChain (substrateApi: _SubstrateApi, useAddresses: string[], chainInfoMap: Record<string, _ChainInfo>, chain: string, callback: (networkKey: string, rs: StakingItem) => void) {
  const { symbol } = _getChainNativeTokenBasicInfo(chainInfoMap[chain]);

  return substrateApi.api.query.staking?.ledger.multi(useAddresses, (ledgers: Codec[]) => {
    let unit = '';

    if (ledgers) {
      for (let i = 0; i < ledgers.length; i++) {
        const ledger = ledgers[i];
        const owner = reformatAddress(useAddresses[i], 42) || undefined;
        const data = ledger.toHuman() as unknown as LedgerData;

        if (data && data.active) {
          const _totalBalance = data.total;
          const _activeBalance = data.active;
          let bnUnlockingBalance = new BN(0);

          data.unlocking.forEach(({ value }) => {
            value = value.split(' ')[0];
            const _unlockingBalance = value.replaceAll(',', '');

            bnUnlockingBalance = bnUnlockingBalance.add(new BN(_unlockingBalance));
          });

          let amount = _totalBalance ? _totalBalance.split(' ')[0] : '';

          amount = amount.replaceAll(',', '');
          unit = _totalBalance ? _totalBalance.split(' ')[1] : '';
          const bnTotalBalance = new BN(amount);

          amount = _activeBalance ? _activeBalance.split(' ')[0] : '';
          amount = amount.replaceAll(',', '');
          unit = _activeBalance ? _activeBalance.split(' ')[1] : '';
          const bnActiveBalance = new BN(amount);

          const stakingItem = {
            name: chainInfoMap[chain].name,
            chain: chain,
            balance: bnTotalBalance.toString(),
            activeBalance: bnActiveBalance.toString(),
            unlockingBalance: bnUnlockingBalance.toString(),
            nativeToken: symbol,
            unit: unit || symbol,
            state: APIItemState.READY,
            type: StakingType.NOMINATED,
            address: owner
          } as StakingItem;

          callback(chain, stakingItem);
        } else {
          const stakingItem = {
            name: chainInfoMap[chain].name,
            chain: chain,
            balance: '0',
            activeBalance: '0',
            unlockingBalance: '0',
            nativeToken: symbol,
            unit: unit || symbol,
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

export function getRelayPoolingOnchain (parentApi: _SubstrateApi, useAddresses: string[], networks: Record<string, _ChainInfo>, chain: string, callback: (networkKey: string, rs: StakingItem) => void) {
  const { symbol } = _getChainNativeTokenBasicInfo(networks[chain]);

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

          const stakingItem = {
            name: networks[chain].name,
            chain: chain,
            balance: totalBalance.toString(),
            activeBalance: bnBondedBalance.toString(),
            unlockingBalance: unlockingBalance.toString(),
            nativeToken: symbol,
            unit: symbol,
            state: APIItemState.READY,
            type: StakingType.POOLED,
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
            type: StakingType.POOLED,
            address: owner
          } as StakingItem;

          callback(chain, stakingItem);
        }
      }
    }
  });
}

export async function getNominationPoolReward (addresses: string[], chainInfoMap: Record<string, _ChainInfo>, substrateApiMap: Record<string, _SubstrateApi>): Promise<StakingRewardItem[]> {
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

  const rewardList: StakingRewardItem[] = [];

  try {
    await Promise.all(targetNetworks.map(async (networkKey) => {
      const substrateApi = await substrateApiMap[networkKey].isReady;

      await Promise.all(validAddresses.map(async (address) => {
        const _unclaimedReward = await substrateApi.api.call?.nominationPoolsApi?.pendingRewards(address);

        if (_unclaimedReward) {
          rewardList.push({
            address: address,
            chain: networkKey,
            unclaimedReward: _unclaimedReward.toString(),
            name: chainInfoMap[networkKey].name,
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
