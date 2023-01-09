// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain/types';
import { APIItemState, StakingItem, StakingRewardItem, StakingType } from '@subwallet/extension-base/background/KoniTypes';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getChainNativeTokenInfo } from '@subwallet/extension-base/services/chain-service/utils';
import { parseStakingBalance } from '@subwallet/extension-koni-base/api/staking/utils';
import { reformatAddress, toUnit } from '@subwallet/extension-koni-base/utils';

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

export function getRelayStakingOnChain (parentApi: _SubstrateApi, useAddresses: string[], networks: Record<string, _ChainInfo>, chain: string, callback: (networkKey: string, rs: StakingItem) => void) {
  const { symbol } = _getChainNativeTokenInfo(networks[chain]);

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
            name: networks[chain].name,
            chain: chain,
            balance: parsedTotal.toString(),
            activeBalance: parsedActiveBalance.toString(),
            unlockingBalance: parsedUnlockingBalance.toString(),
            nativeToken: symbol,
            unit: unit || symbol,
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
  const { symbol } = _getChainNativeTokenInfo(networks[chain]);

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
            name: networks[chain].name,
            chain: chain,
            balance: parsedTotal.toString(),
            activeBalance: parsedActiveBalance.toString(),
            unlockingBalance: parsedUnlockingBalance.toString(),
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
          const unclaimedReward = _unclaimedReward.toString();
          const { decimals } = _getChainNativeTokenInfo(chainInfoMap[networkKey]);
          const parsedUnclaimedReward = toUnit(parseFloat(unclaimedReward), decimals);

          rewardList.push({
            address: address,
            chain: networkKey,
            unclaimedReward: parsedUnclaimedReward.toString(),
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
