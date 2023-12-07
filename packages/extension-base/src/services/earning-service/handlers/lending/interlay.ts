// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { OptimalYieldPath, OptimalYieldPathParams, TokenBalanceRaw } from '@subwallet/extension-base/background/KoniTypes';
import KoniState from '@subwallet/extension-base/koni/background/handlers/State';
import { _getTokenOnChainInfo } from '@subwallet/extension-base/services/chain-service/utils';
import { EarningStatus, LendingYieldPoolInfo, YieldPoolGroup, YieldPoolType, YieldPositionInfo } from '@subwallet/extension-base/types';

import { BN_ZERO } from '@polkadot/util';

import BaseLendingPoolHandler from './base';

export default class InterlayLendingPoolHandler extends BaseLendingPoolHandler {
  protected readonly description: string;
  protected readonly group: YieldPoolGroup;
  protected readonly name: string;
  protected readonly altInputAssets: string[] = ['polkadot-NATIVE-DOT'];
  protected readonly derivativeAssets: string[] = ['interlay-LOCAL-qDOT'];
  protected readonly inputAssets: string[] = ['interlay-LOCAL-DOT'];
  protected readonly rewardAssets: string[] = ['interlay-LOCAL-DOT'];
  protected readonly feeAssets: string[] = ['interlay-NATIVE-INTR', 'interlay-LOCAL-DOT'];
  public slug: string;

  constructor (state: KoniState, chain: string) {
    super(state, chain);

    const chainInfo = this.chainInfo;

    this.slug = `DOT___lending___${chain}`;
    this.name = `${chainInfo.name} Lending`;
    this.description = 'Earn rewards by lending DOT';
    this.group = YieldPoolGroup.DOT;
  }

  /* Subscribe pool info */

  async getPoolStat (): Promise<LendingYieldPoolInfo> {
    const substrateApi = await this.substrateApi.isReady;

    const inputTokenSlug = this.inputAssets[0];
    const inputTokenInfo = this.state.getAssetBySlug(inputTokenSlug);

    const _exchangeRate = await substrateApi.api.query.loans.exchangeRate(_getTokenOnChainInfo(inputTokenInfo));

    const exchangeRate = _exchangeRate.toPrimitive() as number;
    const decimals = 10 ** 18;

    return {
      ...this.defaultInfo,
      metadata: {
        isAvailable: true,
        allowCancelUnstaking: false,
        assetEarning: [
          {
            slug: this.rewardAssets[0],
            apr: 1.29,
            exchangeRate: exchangeRate / decimals
          }
        ],
        maxCandidatePerFarmer: 1,
        maxWithdrawalRequestPerFarmer: 1,
        minJoinPool: '10000000000',
        minWithdrawal: '0',
        totalApr: 1.29,
        tvl: '291890000000000'
      }
    };
  }

  /* Subscribe pool info */

  /* Subscribe pool position */

  async subscribePoolPosition (useAddresses: string[], resultCallback: (rs: YieldPositionInfo) => void): Promise<VoidFunction> {
    let cancel = false;

    const substrateApi = this.substrateApi;

    await substrateApi.isReady;

    const derivativeTokenSlug = this.derivativeAssets[0];
    const derivativeTokenInfo = this.state.getAssetBySlug(derivativeTokenSlug);

    const unsub = await substrateApi.api.query.tokens.accounts.multi(useAddresses.map((address) => [address, _getTokenOnChainInfo(derivativeTokenInfo)]), (_balances) => {
      if (cancel) {
        unsub();

        return;
      }

      const balances = _balances as unknown as TokenBalanceRaw[];

      for (let i = 0; i < balances.length; i++) {
        const balanceItem = balances[i];
        const address = useAddresses[i];
        const totalBalance = balanceItem.free || BN_ZERO;

        const result: YieldPositionInfo = {
          ...this.defaultBaseInfo,
          type: YieldPoolType.LENDING,
          address,
          balance: [
            {
              slug: derivativeTokenSlug, // token slug
              activeBalance: totalBalance.toString()
            }
          ],
          status: EarningStatus.EARNING_REWARD,
          activeStake: totalBalance.toString(),
          nominations: [],
          unstakings: []
        };

        resultCallback(result);
      }
    });

    return () => {
      cancel = true;
      unsub();
    };
  }

  /* Subscribe pool position */

  generateOptimalPath (params: OptimalYieldPathParams): Promise<OptimalYieldPath> {
    throw new Error('Need handle');
  }
}
