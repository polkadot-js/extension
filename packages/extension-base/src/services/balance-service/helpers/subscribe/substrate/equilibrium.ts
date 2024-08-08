// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { SignedBalance } from '@equilab/api/genshiro/interfaces';
import { _AssetType } from '@subwallet/chain-list/types';
import { APIItemState } from '@subwallet/extension-base/background/KoniTypes';
import { _getTokenOnChainAssetId } from '@subwallet/extension-base/services/chain-service/utils';
import { BalanceItem, SubscribeSubstratePalletBalance } from '@subwallet/extension-base/types';
import { filterAssetsByChainAndType } from '@subwallet/extension-base/utils';
import BigN from 'bignumber.js';

import { BN, BN_ZERO } from '@polkadot/util';

type EqBalanceItem = [number, { positive: number }];
type EqBalanceV0 = {
  v0: {
    lock: number,
    balance: EqBalanceItem[]
  }
}

export const subscribeEquilibriumTokenBalance = async ({ addresses, assetMap, callback, chainInfo, includeNativeToken, substrateApi }: SubscribeSubstratePalletBalance): Promise<() => void> => {
  const chain = chainInfo.slug;
  const tokenTypes = includeNativeToken ? [_AssetType.NATIVE, _AssetType.LOCAL] : [_AssetType.LOCAL];
  const tokenMap = filterAssetsByChainAndType(assetMap, chain, tokenTypes);

  try {
    const unsub = await substrateApi.api.query.system.account.multi(addresses, (balances: Record<string, any>[]) => { // Equilibrium customizes the SystemAccount pallet
      Object.values(tokenMap).forEach((tokenInfo) => {
        const assetId = _getTokenOnChainAssetId(tokenInfo);

        const items: BalanceItem[] = balances.map((balance, index) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
          const balancesData = JSON.parse(balance.data.toString()) as EqBalanceV0;
          const balanceList = balancesData.v0.balance;

          // @ts-ignore
          const freeTokenBalance = balanceList.find((data: EqBalanceItem) => data[0] === parseInt(assetId));
          const bnFreeTokenBalance = freeTokenBalance ? new BN(new BigN(freeTokenBalance[1].positive).toString()) : BN_ZERO;

          return {
            address: addresses[index],
            free: bnFreeTokenBalance.toString(),
            locked: '0', // Equilibrium doesn't show locked balance
            state: APIItemState.READY,
            tokenSlug: tokenInfo.slug
          };
        });

        callback(items);
      });
    });

    return () => {
      unsub();
    };
  } catch (e) {
    Object.values(tokenMap).forEach((tokenInfo) => {
      const items: BalanceItem[] = addresses.map((address) => {
        return {
          address: address,
          free: '0',
          locked: '0', // Equilibrium doesn't show locked balance
          state: APIItemState.READY,
          tokenSlug: tokenInfo.slug
        };
      });

      callback(items);
    });

    return () => {
      // Empty
    };
  }
};

// eslint-disable-next-line @typescript-eslint/require-await
export const subscribeEqBalanceAccountPallet = async ({ addresses, assetMap, callback, chainInfo, includeNativeToken, substrateApi }: SubscribeSubstratePalletBalance): Promise<() => void> => {
  const chain = chainInfo.slug;
  const tokenTypes = includeNativeToken ? [_AssetType.NATIVE, _AssetType.LOCAL] : [_AssetType.LOCAL];
  const tokenMap = filterAssetsByChainAndType(assetMap, chain, tokenTypes);

  const unsubList = Object.values(tokenMap).map(async (tokenInfo) => {
    try {
      const assetId = _getTokenOnChainAssetId(tokenInfo);
      const unsub = await substrateApi.api.query.eqBalances.account.multi(addresses.map((address) => [address, [assetId]]), (balances: SignedBalance[]) => {
        const items: BalanceItem[] = balances.map((balance, index) => {
          return {
            address: addresses[index],
            free: balance.asPositive.toString(),
            locked: '0', // Equilibrium doesn't show locked balance
            state: APIItemState.READY,
            tokenSlug: tokenInfo.slug
          };
        });

        callback(items);
      });

      return unsub;
    } catch (err) {
      console.warn(err);

      const items: BalanceItem[] = addresses.map((address) => {
        return {
          address: address,
          free: '0',
          locked: '0', // Equilibrium doesn't show locked balance
          state: APIItemState.READY,
          tokenSlug: tokenInfo.slug
        };
      });

      callback(items);

      return undefined;
    }
  });

  return () => {
    unsubList.forEach((subProm) => {
      subProm.then((unsub) => {
        unsub && unsub();
      }).catch(console.error);
    });
  };
};
