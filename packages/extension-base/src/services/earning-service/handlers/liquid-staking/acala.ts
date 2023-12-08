// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { BasicTxErrorType, ExtrinsicType, RequestYieldStepSubmit, TokenBalanceRaw } from '@subwallet/extension-base/background/KoniTypes';
import { convertDerivativeToOriginToken } from '@subwallet/extension-base/koni/api/yield/helper/utils';
import KoniState from '@subwallet/extension-base/koni/background/handlers/State';
import { _getTokenOnChainInfo } from '@subwallet/extension-base/services/chain-service/utils';
import { fakeAddress } from '@subwallet/extension-base/services/earning-service/constants';
import { BaseYieldStepDetail, EarningStatus, HandleYieldStepData, LiquidYieldPoolInfo, OptimalYieldPath, OptimalYieldPathParams, RuntimeDispatchInfo, SubmitYieldStepData, TransactionData, YieldPoolGroup, YieldPoolType, YieldPositionInfo, YieldStepType, YieldTokenBaseInfo } from '@subwallet/extension-base/types';
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
  protected readonly altInputAsset: string = 'polkadot-NATIVE-DOT';
  protected readonly derivativeAssets: string[] = ['acala-LOCAL-LDOT'];
  protected readonly inputAsset: string = 'acala-LOCAL-DOT';
  protected readonly rewardAssets: string[] = ['acala-LOCAL-DOT'];
  protected readonly feeAssets: string[] = ['acala-NATIVE-ACA', 'acala-LOCAL-DOT'];
  protected override readonly minAmountPercent = 0.98;
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
      ...this.extraInfo,
      type: this.type,
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
          ...this.defaultInfo,
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

  /* Join pool action */

  get submitJoinStepInfo (): BaseYieldStepDetail {
    return {
      name: 'Mint LDOT',
      type: YieldStepType.MINT_LDOT
    };
  }

  async getSubmitStepFee (params: OptimalYieldPathParams): Promise<YieldTokenBaseInfo> {
    const poolOriginSubstrateApi = await this.substrateApi.isReady;
    const defaultFeeTokenSlug = this.feeAssets[0];

    const _mintFeeInfo = await poolOriginSubstrateApi.api.tx.homa.mint(params.amount).paymentInfo(fakeAddress);
    const mintFeeInfo = _mintFeeInfo.toPrimitive() as unknown as RuntimeDispatchInfo;

    return {
      amount: mintFeeInfo.partialFee.toString(),
      slug: defaultFeeTokenSlug
    };
  }

  async handleSubmitStep (address: string, params: OptimalYieldPathParams, requestData: RequestYieldStepSubmit, path: OptimalYieldPath, currentStep: number): Promise<HandleYieldStepData> {
    const inputData = requestData.data as SubmitYieldStepData;
    const substrateApi = await this.substrateApi.isReady;
    const extrinsic = substrateApi.api.tx.homa.mint(inputData.amount);

    return {
      txChain: this.chain,
      extrinsicType: ExtrinsicType.MINT_LDOT,
      extrinsic,
      txData: requestData,
      transferNativeAmount: '0'
    };
  }

  /* Join pool action */

  /* Leave pool action */

  async handleYieldLeave (amount: string, address: string, selectedTarget?: string): Promise<[ExtrinsicType, TransactionData]> {
    const substrateApi = await this.substrateApi.isReady;
    // @ts-ignore
    const yieldPositionInfo = await this.getPoolPosition(address);
    const poolInfo = await this.getPoolInfo();
    const originTokenSlug = this.inputAsset;
    const derivativeTokenSlug = this.derivativeAssets[0];
    const derivativeTokenInfo = this.state.getAssetBySlug(derivativeTokenSlug);
    const originTokenInfo = this.state.getAssetBySlug(originTokenSlug);

    if (!yieldPositionInfo || !poolInfo) {
      return Promise.reject(new TransactionError(BasicTxErrorType.INVALID_PARAMS));
    }

    const formattedMinAmount = convertDerivativeToOriginToken(amount, poolInfo, derivativeTokenInfo, originTokenInfo);
    const weightedMinAmount = Math.floor(this.minAmountPercent * formattedMinAmount);

    const extrinsic = substrateApi.api.tx.aggregatedDex.swapWithExactSupply(
      // Swap path
      [
        {
          Taiga: [
            0, /* pool id */
            1, /* supply asset */
            0 /* target asset */
          ]
        }
      ],
      // Supply amount
      amount,
      // Min target amount
      weightedMinAmount // should always set a min target to prevent unexpected result
    );

    return [ExtrinsicType.REDEEM_QDOT, extrinsic];
  }

  /* Leave pool action */
}
