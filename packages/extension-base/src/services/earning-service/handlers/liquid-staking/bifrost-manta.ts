// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { ChainType, ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import KoniState from '@subwallet/extension-base/koni/background/handlers/State';
import { _getAssetDecimals, _getTokenOnChainInfo } from '@subwallet/extension-base/services/chain-service/utils';
import { BaseYieldStepDetail, HandleYieldStepData, LiquidYieldPoolInfo, OptimalYieldPath, SubmitYieldJoinData, TransactionData, YieldStepType } from '@subwallet/extension-base/types';

import BifrostLiquidStakingPoolHandler from './bifrost';

export interface BifrostLiquidStakingMeta {
  apy: string,
  apyBase: string,
  apyReward: string,
  tvl: number,
  tvm: number,
  holders: number
}

export interface BifrostVtokenExchangeRateResp {
  ratio: BifrostVtokenExchangeRate[]
}

export interface BifrostVtokenExchangeRate {
  ratio: string,
  key: string,
  timestamp: string,
  total_issuance: number,
  token_pool: number
}

const STATS_URL = 'https://api.bifrost.app/api/site';
const RATIO_URL = 'https://api.bifrost.app/api/omni/MANTA';

export default class BifrostMantaLiquidStakingPoolHandler extends BifrostLiquidStakingPoolHandler {
  protected override readonly altInputAsset: string = 'manta_network-NATIVE-MANTA';
  protected override readonly derivativeAssets: string[] = ['bifrost_dot-LOCAL-vMANTA'];
  protected override readonly inputAsset: string = 'bifrost_dot-LOCAL-MANTA';
  protected override readonly rewardAssets: string[] = ['bifrost_dot-LOCAL-MANTA'];
  protected override readonly feeAssets: string[] = ['bifrost_dot-NATIVE-BNC', 'bifrost_dot-LOCAL-MANTA'];
  public override readonly minAmountPercent: number = 0.985;

  constructor (state: KoniState, chain: string) {
    super(state, chain);

    const chainInfo = this.chainInfo;

    this.slug = `MANTA___liquid_staking___${chain}`;
    this.name = `${chainInfo.name} Liquid Staking Manta`;
    this.shortName = chainInfo.name.replaceAll(' Relay Chain', '');
  }

  protected override getDescription (): string {
    return 'Stake MANTA to earn yield on vMANTA';
  }

  /* Subscribe pool info */

  override async getPoolStat (): Promise<LiquidYieldPoolInfo> {
    const substrateApi = await this.substrateApi.isReady;

    const stakingMetaPromise = new Promise(function (resolve) {
      fetch(STATS_URL, {
        method: 'GET'
      }).then((res) => {
        resolve(res.json());
      }).catch(console.error);
    });

    const exchangeRatePromise = new Promise(function (resolve) {
      fetch(RATIO_URL, {
        method: 'GET'
      }).then((resp) => {
        resolve(resp.json());
      }).catch(console.error);
    });

    const derivativeTokenInfo = this.state.getAssetBySlug(this.derivativeAssets[0]);
    const inputTokenInfo = this.state.getAssetBySlug(this.inputAsset);

    const [_stakingMeta, _exchangeRate, _minimumRedeem, _minimumMint] = await Promise.all([
      stakingMetaPromise,
      exchangeRatePromise,
      substrateApi.api.query.vtokenMinting.minimumRedeem(_getTokenOnChainInfo(derivativeTokenInfo)),
      substrateApi.api.query.vtokenMinting.minimumMint(_getTokenOnChainInfo(inputTokenInfo))
    ]);

    const minimumRedeem = _minimumRedeem.toString();
    const minimumMint = _minimumMint.toString();

    const stakingMeta = _stakingMeta as Record<string, BifrostLiquidStakingMeta>;
    const exchangeRate = _exchangeRate as BifrostVtokenExchangeRateResp;

    const vMANTAStats = stakingMeta.vMANTA;
    const assetInfo = this.state.getAssetBySlug(this.inputAsset);
    const assetDecimals = 10 ** _getAssetDecimals(assetInfo);
    const rate = parseFloat(exchangeRate.ratio[exchangeRate.ratio.length - 1].ratio);// TODO

    this.updateExchangeRate(rate);

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
            apy: parseFloat(vMANTAStats.apyBase),
            exchangeRate: rate
          }
        ],
        farmerCount: vMANTAStats.holders,
        unstakingPeriod: 24 * 7,
        maxCandidatePerFarmer: 1,
        maxWithdrawalRequestPerFarmer: 1,
        earningThreshold: {
          join: minimumMint,
          defaultUnstake: minimumRedeem,
          fastUnstake: '0'
        },
        totalApy: parseFloat(vMANTAStats.apyBase),
        tvl: (vMANTAStats.tvm * assetDecimals).toString()
      }
    };
  }

  /* Subscribe pool info */

  /* Join pool action */

  override get submitJoinStepInfo (): BaseYieldStepDetail {
    return {
      name: 'Mint vMANTA',
      type: YieldStepType.MINT_VMANTA
    };
  }

  override async handleSubmitStep (data: SubmitYieldJoinData, path: OptimalYieldPath): Promise<HandleYieldStepData> {
    const substrateApi = await this.substrateApi.isReady;
    const inputTokenSlug = this.inputAsset;
    const inputTokenInfo = this.state.getAssetBySlug(inputTokenSlug);
    const extrinsic = substrateApi.api.tx.vtokenMinting.mint(_getTokenOnChainInfo(inputTokenInfo), data.amount, undefined, undefined);

    return {
      txChain: this.chain,
      extrinsicType: ExtrinsicType.MINT_VMANTA,
      extrinsic,
      txData: data,
      transferNativeAmount: '0',
      chainType: ChainType.SUBSTRATE
    };
  }

  /* Join pool action */

  /* Leave pool action */

  override async handleYieldRedeem (amount: string, address: string, selectedTarget?: string): Promise<[ExtrinsicType, TransactionData]> {
    const substrateApi = await this.substrateApi.isReady;
    const weightedMinAmount = await this.createParamToRedeem(amount, address);

    const extrinsic = substrateApi.api.tx.stablePool.swap(5, 1, 0, amount, weightedMinAmount);

    return [ExtrinsicType.REDEEM_VMANTA, extrinsic];
  }

  override async handleYieldUnstake (amount: string, address: string, selectedTarget?: string): Promise<[ExtrinsicType, TransactionData]> {
    const chainApi = await this.substrateApi.isReady;
    const derivativeTokenSlug = this.derivativeAssets[0];
    const derivativeTokenInfo = this.state.getAssetBySlug(derivativeTokenSlug);
    const extrinsic = chainApi.api.tx.vtokenMinting.redeem(_getTokenOnChainInfo(derivativeTokenInfo), amount);

    return [ExtrinsicType.UNSTAKE_VMANTA, extrinsic];
  }

  /* Leave pool action */
}
