// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { SignedBalance } from '@equilab/api/genshiro/interfaces';
import { _AssetType } from '@subwallet/chain-list/types';
import { APIItemState, BalanceItem } from '@subwallet/extension-base/background/KoniTypes';
import { state } from '@subwallet/extension-base/koni/background/handlers';
import { _getTokenOnChainAssetId } from '@subwallet/extension-base/services/chain-service/utils';
import { sumBN } from '@subwallet/extension-base/utils';
import BigN from 'bignumber.js';

import { ApiPromise } from '@polkadot/api';
import { BN, BN_ZERO } from '@polkadot/util';

type EqBalanceItem = [number, { positive: number }];
type EqBalanceV0 = {
  v0: {
    lock: number,
    balance: EqBalanceItem[]
  }
}

export async function subscribeEquilibriumTokenBalance (addresses: string[], chain: string, api: ApiPromise, callBack: (rs: BalanceItem) => void, includeNativeToken?: boolean): Promise<() => void> {
  const tokenTypes = includeNativeToken ? [_AssetType.NATIVE, _AssetType.LOCAL] : [_AssetType.LOCAL];
  const tokenMap = state.getAssetByChainAndAsset(chain, tokenTypes);

  const unsub = await api.query.system.account.multi(addresses, (balances: Record<string, any>[]) => { // Equilibrium customizes the SystemAccount pallet
    Object.values(tokenMap).forEach((tokenInfo) => {
      const assetId = _getTokenOnChainAssetId(tokenInfo);
      let tokenFreeBalance = BN_ZERO;

      for (const balance of balances) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        const balancesData = JSON.parse(balance.data.toString()) as EqBalanceV0;
        const balanceList = balancesData.v0.balance;

        // @ts-ignore
        const freeTokenBalance = balanceList.find((data: EqBalanceItem) => data[0] === parseInt(assetId));
        const bnFreeTokenBalance = freeTokenBalance ? new BN(new BigN(freeTokenBalance[1].positive).toString()) : BN_ZERO;

        tokenFreeBalance = tokenFreeBalance.add(bnFreeTokenBalance);
      }

      const tokenBalance: BalanceItem = {
        free: tokenFreeBalance.toString(),
        locked: '0', // Equilibrium doesn't show locked balance
        state: APIItemState.READY,
        tokenSlug: tokenInfo.slug
      };

      callBack(tokenBalance);
    });
  });

  return () => {
    unsub();
  };
}

// eslint-disable-next-line @typescript-eslint/require-await
export async function subscribeEqBalanceAccountPallet (addresses: string[], chain: string, api: ApiPromise, callBack: (rs: BalanceItem) => void, includeNativeToken?: boolean): Promise<() => void> {
  const tokenTypes = includeNativeToken ? [_AssetType.NATIVE, _AssetType.LOCAL] : [_AssetType.LOCAL];
  const tokenMap = state.getAssetByChainAndAsset(chain, tokenTypes);

  const unsubList = Object.values(tokenMap).map(async (tokenInfo) => {
    try {
      const assetId = _getTokenOnChainAssetId(tokenInfo);
      const unsub = await api.query.eqBalances.account.multi(addresses.map((address) => [address, [assetId]]), (balances: SignedBalance[]) => {
        const tokenBalance = {
          free: sumBN(balances.map((b) => (b.asPositive))).toString(),
          locked: '0', // Equilibrium doesn't show locked balance
          state: APIItemState.READY,
          tokenSlug: tokenInfo.slug
        };

        callBack(tokenBalance);
      });

      return unsub;
    } catch (err) {
      console.warn(err);

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
}
