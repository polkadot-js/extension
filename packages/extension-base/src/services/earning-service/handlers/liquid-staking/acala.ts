// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { ChainType, ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import KoniState from '@subwallet/extension-base/koni/background/handlers/State';
import { _getTokenOnChainInfo } from '@subwallet/extension-base/services/chain-service/utils';
import { fakeAddress } from '@subwallet/extension-base/services/earning-service/constants';
import { BaseYieldStepDetail, EarningStatus, HandleYieldStepData, LiquidYieldPoolInfo, OptimalYieldPath, OptimalYieldPathParams, RuntimeDispatchInfo, SubmitYieldJoinData, TokenBalanceRaw, TransactionData, UnstakingInfo, UnstakingStatus, YieldPoolMethodInfo, YieldPositionInfo, YieldStepType, YieldTokenBaseInfo } from '@subwallet/extension-base/types';

import { BN, BN_TEN, BN_ZERO } from '@polkadot/util';

import BaseLiquidStakingPoolHandler from './base';

interface AcalaLiquidStakingMetaItem {
  exchangeRate: string,
  timestamp: string
}

interface AcalaLiquidStakingMeta {
  data: {
    dailySummaries: {
      nodes: AcalaLiquidStakingMetaItem[]
    }
  }
}

type AcalaLiquidStakingRedeemRequest = [number, boolean];

const GRAPHQL_API = 'https://api.polkawallet.io/acala-liquid-staking-subql';
const EXCHANGE_RATE_REQUEST = 'query { dailySummaries(first:30, orderBy:TIMESTAMP_DESC) {nodes { exchangeRate timestamp }}}';

export default class AcalaLiquidStakingPoolHandler extends BaseLiquidStakingPoolHandler {
  protected readonly name: string;
  protected readonly shortName: string;
  protected readonly altInputAsset: string = 'polkadot-NATIVE-DOT';
  protected readonly derivativeAssets: string[] = ['acala-LOCAL-LDOT'];
  protected readonly inputAsset: string = 'acala-LOCAL-DOT';
  protected readonly rewardAssets: string[] = ['acala-LOCAL-DOT'];
  protected readonly feeAssets: string[] = ['acala-NATIVE-ACA', 'acala-LOCAL-DOT'];
  public override readonly minAmountPercent = 0.98;
  protected readonly rateDecimals = 10;

  protected readonly availableMethod: YieldPoolMethodInfo = {
    join: true,
    defaultUnstake: true,
    fastUnstake: true,
    cancelUnstake: false,
    withdraw: false, // TODO: Change after verify unstake info
    claimReward: false
  };

  public slug: string;

  constructor (state: KoniState, chain: string) {
    super(state, chain);

    const chainInfo = this.chainInfo;

    this.slug = `DOT___liquid_staking___${chain}`;
    this.name = `${chainInfo.name} Liquid Staking`;
    this.shortName = chainInfo.name.replaceAll(' Relay Chain', '');
  }

  protected getDescription (): string {
    return 'Stake DOT to earn yield on LDOT';
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

    const mintThreshold = substrateApi.api.consts.homa.mintThreshold.toString();
    const redeemThreshold = substrateApi.api.consts.homa.redeemThreshold.toString();

    const stakingMeta = _stakingMeta as AcalaLiquidStakingMeta;
    const stakingMetaList = stakingMeta.data.dailySummaries.nodes;
    const latestExchangeRate = parseInt(stakingMetaList[0].exchangeRate);
    const decimals = 10 ** this.rateDecimals;

    this.updateExchangeRate(latestExchangeRate);

    const endingBalance = parseInt(stakingMetaList[0].exchangeRate);
    const beginBalance = parseInt(stakingMetaList[29].exchangeRate);

    const diff = endingBalance / beginBalance;
    const apy = diff ** (365 / 30) - 1;

    const toBondPool = new BN(_toBondPool.toString());
    const totalStakingBonded = new BN(_totalStakingBonded.toString());

    return {
      ...this.baseInfo,
      type: this.type,
      metadata: {
        ...this.metadataInfo,
        description: this.getDescription()
      },
      statistic: {
        assetEarning: [
          {
            slug: this.rewardAssets[0],
            apy: apy * 100,
            exchangeRate: latestExchangeRate / decimals
          }
        ],
        unstakingPeriod: 24 * 28,
        maxCandidatePerFarmer: 1,
        maxWithdrawalRequestPerFarmer: 1,
        earningThreshold: {
          join: mintThreshold,
          defaultUnstake: redeemThreshold,
          fastUnstake: '0'
        },
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

    const unsub = await substrateApi.api.query.tokens.accounts.multi(useAddresses.map((address) => [address, _getTokenOnChainInfo(derivativeTokenInfo)]), async (_balances) => {
      if (cancel) {
        unsub();

        return;
      }

      const balances = _balances as unknown as TokenBalanceRaw[];
      const redeemRequests = await substrateApi.api.query.homa.redeemRequests.multi(useAddresses);
      // This rate is multiple with decimals
      const exchangeRate = await this.getExchangeRate();
      const decimals = BN_TEN.pow(new BN(this.rateDecimals));

      for (let i = 0; i < balances.length; i++) {
        const balanceItem = balances[i];
        const address = useAddresses[i];
        const activeTotalBalance = balanceItem.free || BN_ZERO;
        let totalBalance = activeTotalBalance.mul(new BN(exchangeRate)).div(decimals);
        let unlockingBalance = BN_ZERO;

        const unstakings: UnstakingInfo[] = [];

        const redeemRequest = redeemRequests[i].toPrimitive() as unknown as AcalaLiquidStakingRedeemRequest;

        if (redeemRequest) {
          // If withdrawable = false, redeem request is claimed
          const [redeemAmount, withdrawable] = redeemRequest;

          // Redeem amount in derivative token
          const amount = new BN(redeemAmount).mul(new BN(exchangeRate)).div(decimals);

          totalBalance = totalBalance.add(amount);
          unlockingBalance = unlockingBalance.add(amount);

          unstakings.push({
            chain: this.chain,
            status: withdrawable ? UnstakingStatus.CLAIMABLE : UnstakingStatus.UNLOCKING,
            claimable: amount.toString()
          });
        }

        const result: YieldPositionInfo = {
          ...this.baseInfo,
          type: this.type,
          address,
          balanceToken: this.inputAsset,
          totalStake: totalBalance.toString(),
          activeStake: activeTotalBalance.toString(),
          unstakeBalance: unlockingBalance.toString(),
          status: activeTotalBalance.gt(BN_ZERO) ? EarningStatus.EARNING_REWARD : EarningStatus.NOT_EARNING,
          derivativeToken: derivativeTokenSlug,
          isBondedBefore: totalBalance.gt(BN_ZERO),
          nominations: [],
          unstakings: unstakings
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

    if (new BN(params.amount).gt(BN_ZERO)) {
      const _mintFeeInfo = await poolOriginSubstrateApi.api.tx.homa.mint(params.amount).paymentInfo(fakeAddress);
      const mintFeeInfo = _mintFeeInfo.toPrimitive() as unknown as RuntimeDispatchInfo;

      return {
        amount: mintFeeInfo.partialFee.toString(),
        slug: defaultFeeTokenSlug
      };
    } else {
      return {
        amount: '0',
        slug: defaultFeeTokenSlug
      };
    }
  }

  async handleSubmitStep (data: SubmitYieldJoinData, path: OptimalYieldPath): Promise<HandleYieldStepData> {
    const substrateApi = await this.substrateApi.isReady;
    const extrinsic = substrateApi.api.tx.homa.mint(data.amount);

    return {
      txChain: this.chain,
      extrinsicType: ExtrinsicType.MINT_LDOT,
      extrinsic,
      txData: data,
      transferNativeAmount: '0',
      chainType: ChainType.SUBSTRATE
    };
  }

  /* Join pool action */

  /* Leave pool action */

  async handleYieldRedeem (amount: string, address: string, selectedTarget?: string): Promise<[ExtrinsicType, TransactionData]> {
    const substrateApi = await this.substrateApi.isReady;
    const weightedMinAmount = await this.createParamToRedeem(amount, address);
    // const extrinsic = substrateApi.api.tx.stableAsset.swap(0, 1, 0, amount, weightedMinAmount);
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

    return [ExtrinsicType.REDEEM_LDOT, extrinsic];
  }

  override async handleYieldUnstake (amount: string, address: string, selectedTarget?: string): Promise<[ExtrinsicType, TransactionData]> {
    const chainApi = await this.substrateApi.isReady;
    const extrinsic = chainApi.api.tx.homa.requestRedeem(amount, false);

    return [ExtrinsicType.UNSTAKE_LDOT, extrinsic];
  }

  override async handleYieldWithdraw (address: string, unstakingInfo: UnstakingInfo): Promise<TransactionData> {
    const chainApi = await this.substrateApi.isReady;

    return chainApi.api.tx.homa.claimRedemption(address);
  }

  /* Leave pool action */
}
