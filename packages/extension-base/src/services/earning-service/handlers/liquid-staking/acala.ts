// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { OptimalYieldPath, OptimalYieldPathParams, TokenBalanceRaw } from '@subwallet/extension-base/background/KoniTypes';
import KoniState from '@subwallet/extension-base/koni/background/handlers/State';
import { _getTokenOnChainInfo } from '@subwallet/extension-base/services/chain-service/utils';
import { EarningStatus, LiquidYieldPoolInfo, YieldPoolGroup, YieldPoolType, YieldPositionInfo } from '@subwallet/extension-base/types';
import fetch from 'cross-fetch';

import { BN, BN_ZERO } from '@polkadot/util';

import BaseLiquidStakingPoolHandler from './base';

interface BifrostLiquidStakingMetaItem {
  exchangeRate: string,
  timestamp: string
}

interface BifrostLiquidStakingMeta {
  data: {
    dailySummaries: {
      nodes: BifrostLiquidStakingMetaItem[]
    }
  }
}

const GRAPHQL_API = 'https://api.polkawallet.io/acala-liquid-staking-subql';
const EXCHANGE_RATE_REQUEST = 'query { dailySummaries(first:30, orderBy:TIMESTAMP_DESC) {nodes { exchangeRate timestamp }}}';

export default class AcalaLiquidStakingPoolHandler extends BaseLiquidStakingPoolHandler {
  protected readonly description: string;
  protected readonly group: YieldPoolGroup;
  protected readonly name: string;
  protected readonly altInputAssets: string[] = ['polkadot-NATIVE-DOT'];
  protected readonly derivativeAssets: string[] = ['acala-LOCAL-LDOT'];
  protected readonly inputAssets: string[] = ['acala-LOCAL-DOT'];
  protected readonly rewardAssets: string[] = ['acala-LOCAL-DOT'];
  protected readonly feeAssets: string[] = ['acala-NATIVE-ACA', 'acala-LOCAL-DOT'];
  public slug: string;

  constructor (state: KoniState, chain: string) {
    super(state, chain);

    const chainInfo = this.chainInfo;

    this.slug = `DOT___liquid_staking___${chain}`;
    this.name = `${chainInfo.name} Liquid Staking`;
    this.description = 'Stake DOT to earn yield on LDOT';
    this.group = YieldPoolGroup.DOT;
  }

  /* Subscribe pool info */

  async getPoolStat (): Promise<LiquidYieldPoolInfo> {
    const substrateApi = await this.substrateApi.isReady;

    const stakingMetaPromise = new Promise(function (resolve) {
      fetch(GRAPHQL_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: EXCHANGE_RATE_REQUEST
        })
      }).then((res) => {
        resolve(res.json());
      }).catch(console.error);
    });

    const [_toBondPool, _totalStakingBonded, _stakingMeta] = await Promise.all([
      substrateApi.api.query.homa.toBondPool(),
      substrateApi.api.query.homa.totalStakingBonded(),
      stakingMetaPromise
    ]);

    const stakingMeta = _stakingMeta as BifrostLiquidStakingMeta;
    const stakingMetaList = stakingMeta.data.dailySummaries.nodes;
    const latestExchangeRate = parseInt(stakingMetaList[0].exchangeRate);
    const decimals = 10 ** 10;

    const endingBalance = parseInt(stakingMetaList[0].exchangeRate);
    const beginBalance = parseInt(stakingMetaList[29].exchangeRate);

    const diff = endingBalance / beginBalance;
    const apy = diff ** (365 / 30) - 1;

    const toBondPool = new BN(_toBondPool.toString());
    const totalStakingBonded = new BN(_totalStakingBonded.toString());

    return {
      ...this.defaultInfo,

      metadata: {
        isAvailable: true,
        allowCancelUnstaking: false,
        assetEarning: [
          {
            slug: this.rewardAssets[0],
            apy: apy * 100,
            exchangeRate: latestExchangeRate / decimals
          }
        ],
        maxCandidatePerFarmer: 1,
        maxWithdrawalRequestPerFarmer: 1,
        minJoinPool: '50000000000',
        minWithdrawal: '50000000000',
        totalApy: apy * 100,
        tvl: totalStakingBonded.add(toBondPool).toString()
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
        const activeBalance = balanceItem.free || BN_ZERO;

        const result: YieldPositionInfo = {
          ...this.defaultBaseInfo,
          type: YieldPoolType.LIQUID_STAKING,
          address,
          balance: [
            {
              slug: derivativeTokenSlug, // token slug
              activeBalance: activeBalance.toString()
            }
          ],
          status: EarningStatus.EARNING_REWARD,
          activeStake: activeBalance.toString(),
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
