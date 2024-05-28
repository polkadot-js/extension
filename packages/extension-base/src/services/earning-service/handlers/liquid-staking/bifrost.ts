// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { ChainType, ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import KoniState from '@subwallet/extension-base/koni/background/handlers/State';
import { _STAKING_ERA_LENGTH_MAP } from '@subwallet/extension-base/services/chain-service/constants';
import { _getAssetDecimals, _getTokenOnChainInfo } from '@subwallet/extension-base/services/chain-service/utils';
import { fakeAddress } from '@subwallet/extension-base/services/earning-service/constants';
import { BaseYieldStepDetail, EarningStatus, HandleYieldStepData, LiquidYieldPoolInfo, LiquidYieldPositionInfo, OptimalYieldPath, OptimalYieldPathParams, RuntimeDispatchInfo, SubmitYieldJoinData, TokenBalanceRaw, TransactionData, UnstakingInfo, UnstakingStatus, YieldPoolMethodInfo, YieldPositionInfo, YieldStepType, YieldTokenBaseInfo } from '@subwallet/extension-base/types';
import { reformatAddress } from '@subwallet/extension-base/utils';
import BigNumber from 'bignumber.js';

import { BN, BN_ZERO } from '@polkadot/util';

import BaseLiquidStakingPoolHandler from './base';

export interface BifrostLiquidStakingMeta {
  apy: string,
  apyBase: string,
  apyReward: string,
  tvl: number,
  tvm: number,
  holders: number
}

export interface BifrostVtokenExchangeRateResp {
  data: {
    slp_polkadot_ratio: BifrostVtokenExchangeRate[]
  }
}

export interface BifrostVtokenExchangeRate {
  ratio: string,
  key: string,
  timestamp: string,
  total_issuance: number,
  token_pool: number
}

interface BifrostUnlockLedger {
  address: string,
  ledgerId: number
}

interface BifrostUnlockInfo {
  balance: string,
  era: number
}

const STATS_URL = 'https://api.bifrost.app/api/site';
const BIFROST_GRAPHQL_ENDPOINT = 'https://bifrost-subsql.liebi.com/v1/graphql';
const BIFROST_EXCHANGE_RATE_REQUEST = 'query MyQuery{slp_polkadot_ratio(limit:1 where:{key:{_eq:"0"}} order_by:{timestamp:desc_nulls_first}){ratio key timestamp total_issuance token_pool}}';

export default class BifrostLiquidStakingPoolHandler extends BaseLiquidStakingPoolHandler {
  public slug: string;
  protected name: string;
  protected shortName: string;
  protected readonly altInputAsset: string = 'polkadot-NATIVE-DOT';
  protected readonly derivativeAssets: string[] = ['bifrost_dot-LOCAL-vDOT'];
  protected readonly inputAsset: string = 'bifrost_dot-LOCAL-DOT';
  protected readonly rewardAssets: string[] = ['bifrost_dot-LOCAL-DOT'];
  protected readonly feeAssets: string[] = ['bifrost_dot-NATIVE-BNC', 'bifrost_dot-LOCAL-DOT'];
  public override readonly minAmountPercent: number = 0.99;
  protected readonly availableMethod: YieldPoolMethodInfo = {
    join: true,
    defaultUnstake: true,
    fastUnstake: true,
    cancelUnstake: false,
    withdraw: false,
    claimReward: false
  };

  protected readonly rateDecimals = 0;

  constructor (state: KoniState, chain: string) {
    super(state, chain);

    const chainInfo = this.chainInfo;

    this.slug = `DOT___liquid_staking___${chain}`;
    this.name = `${chainInfo.name} Liquid Staking DOT`;
    this.shortName = chainInfo.name.replaceAll(' Relay Chain', '');
  }

  protected getDescription (): string {
    return 'Stake DOT to earn yield on vDOT';
  }

  /* Subscribe pool info */

  async getPoolStat (): Promise<LiquidYieldPoolInfo> {
    const substrateApi = await this.substrateApi.isReady;

    const stakingMetaPromise = new Promise(function (resolve) {
      fetch(STATS_URL, {
        method: 'GET'
      }).then((res) => {
        resolve(res.json());
      }).catch(console.error);
    });

    const exchangeRatePromise = new Promise(function (resolve) {
      fetch(BIFROST_GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: BIFROST_EXCHANGE_RATE_REQUEST
        })
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

    const vDOTStats = stakingMeta.vDOT;
    const assetInfo = this.state.getAssetBySlug(this.inputAsset);
    const assetDecimals = 10 ** _getAssetDecimals(assetInfo);
    const rate = parseFloat(exchangeRate.data.slp_polkadot_ratio[0].ratio);

    /** Special for bifrost, the rate is divined and unknown decimals to convert (asset decimal is 10 but the rate length is 18) */
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
            apy: parseFloat(vDOTStats.apyBase),
            exchangeRate: rate
          }
        ],
        unstakingPeriod: 24 * 28,
        maxCandidatePerFarmer: 1,
        maxWithdrawalRequestPerFarmer: 1,
        farmerCount: vDOTStats.holders,
        earningThreshold: {
          join: minimumMint,
          defaultUnstake: minimumRedeem,
          fastUnstake: '0'
        },
        totalApy: parseFloat(vDOTStats.apyBase),
        tvl: (vDOTStats.tvm * assetDecimals).toString()
      }
    };
  }

  /* Subscribe pool info */

  /* Subscribe pool position */

  async subscribePoolPosition (useAddresses: string[], resultCallback: (rs: YieldPositionInfo) => void): Promise<VoidFunction> {
    let cancel = false;

    const substrateApi = this.substrateApi;

    await substrateApi.isReady;

    // @ts-ignore
    const derivativeTokenSlug = this.derivativeAssets[0];
    const derivativeTokenInfo = this.state.getAssetBySlug(derivativeTokenSlug);

    const inputTokenSlug = this.inputAsset;
    const inputTokenInfo = this.state.getAssetBySlug(inputTokenSlug);

    const unsub = await substrateApi.api.query.tokens.accounts.multi(useAddresses.map((address) => [address, _getTokenOnChainInfo(derivativeTokenInfo)]), async (_balance) => {
      if (cancel) {
        unsub();

        return;
      }

      const balances = _balance as unknown as TokenBalanceRaw[];

      const [_unlockLedgerList, _currentRelayEra, rate] = await Promise.all([
        substrateApi.api.query.vtokenMinting.userUnlockLedger.multi(useAddresses.map((address) => [address, _getTokenOnChainInfo(inputTokenInfo)])),
        substrateApi.api.query.vtokenMinting.ongoingTimeUnit(_getTokenOnChainInfo(inputTokenInfo)),
        this.getExchangeRate()
      ]);

      const exchangeRate = new BigNumber(rate);

      const currentRelayEraObj = _currentRelayEra.toPrimitive() as Record<string, number>;

      const currentRelayEra = currentRelayEraObj.era;

      const unlockLedgerList: BifrostUnlockLedger[] = [];

      const activeBalanceMap: Record<string, BN> = {};

      for (let i = 0; i < balances.length; i++) {
        const balanceItem = balances[i];
        const address = useAddresses[i];
        const formattedAddress = reformatAddress(address);

        activeBalanceMap[formattedAddress] = balanceItem.free || BN_ZERO;

        const _unlockLedger = _unlockLedgerList[i];
        const unlockLedger = _unlockLedger.toPrimitive();

        if (unlockLedger) {
          // @ts-ignore
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          const unstakingLedgerIds = unlockLedger[1] as number[];

          unstakingLedgerIds.forEach((ledgerId) => {
            unlockLedgerList.push({
              address: formattedAddress,
              ledgerId
            });
          });
        }

        // const bnTotalBalance = bnActiveBalance.add(bnUnstakingBalance);
      }

      const unlockingMap: Record<string, BifrostUnlockInfo[]> = {};

      // TODO: review unstaking info vtokenMinting.userUnlockLedger
      const _unlockInfoList = await substrateApi.api.query.vtokenMinting.tokenUnlockLedger.multi(unlockLedgerList.map(({ ledgerId }) => [_getTokenOnChainInfo(inputTokenInfo), ledgerId]));

      for (let i = 0; i < _unlockInfoList.length; i++) {
        const unlockInfo = _unlockInfoList[i].toPrimitive() as unknown[];

        const owner = reformatAddress(unlockInfo[0] as string);
        const amount = (unlockInfo[1] as number).toString();
        // @ts-ignore
        const withdrawalEra = unlockInfo[2].era as number;

        if (owner in unlockingMap) {
          unlockingMap[owner].push({
            balance: amount,
            era: withdrawalEra
          });
        } else {
          unlockingMap[owner] = [
            {
              balance: amount,
              era: withdrawalEra
            }
          ];
        }
      }

      const unstakingList: UnstakingInfo[] = [];

      useAddresses.forEach((address) => {
        const formattedAddress = reformatAddress(address);

        const bnActiveBalance = activeBalanceMap[formattedAddress];
        const unlockings = unlockingMap[formattedAddress];
        let unlockBalance = BN_ZERO;

        if (unlockings) {
          unlockings.forEach((unlocking) => {
            const isClaimable = unlocking.era - currentRelayEra < 0;
            const remainingEra = unlocking.era - currentRelayEra;
            const waitingTime = remainingEra * _STAKING_ERA_LENGTH_MAP[this.chain];
            // const currentTimestampMs = Date.now();
            // const targetTimestampMs = currentTimestampMs + waitingTime * 60 * 60 * 1000;

            unlockBalance = unlockBalance.add(new BN(unlocking.balance));
            unstakingList.push({
              chain: this.chain,
              status: isClaimable ? UnstakingStatus.CLAIMABLE : UnstakingStatus.UNLOCKING,
              claimable: unlocking.balance,
              waitingTime: waitingTime
              // targetTimestampMs: targetTimestampMs
            } as UnstakingInfo);
          });
        }

        const activeToTotalBalance = exchangeRate.multipliedBy(bnActiveBalance.toString());
        const totalBalance = activeToTotalBalance.plus(unlockBalance.toString());

        const result: LiquidYieldPositionInfo = {
          ...this.baseInfo,
          type: this.type,
          address,
          balanceToken: this.inputAsset,
          derivativeToken: derivativeTokenSlug,
          totalStake: totalBalance.toString(),
          activeStake: bnActiveBalance.toString(),
          unstakeBalance: unlockBalance.toString(),
          status: bnActiveBalance.gt(BN_ZERO) ? EarningStatus.EARNING_REWARD : EarningStatus.NOT_EARNING,
          isBondedBefore: totalBalance.gt(BN_ZERO.toString()),
          nominations: [],
          unstakings: unstakingList
        };

        resultCallback(result);
      });
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
      name: 'Mint vDOT',
      type: YieldStepType.MINT_VDOT
    };
  }

  async getSubmitStepFee (params: OptimalYieldPathParams): Promise<YieldTokenBaseInfo> {
    const poolOriginSubstrateApi = await this.substrateApi.isReady;
    const inputTokenSlug = this.inputAsset;
    const inputTokenInfo = this.state.getAssetBySlug(inputTokenSlug);
    const defaultFeeTokenSlug = this.feeAssets[0];

    if (new BN(params.amount).gt(BN_ZERO)) {
      const _mintFeeInfo = await poolOriginSubstrateApi.api.tx.vtokenMinting.mint(_getTokenOnChainInfo(inputTokenInfo), params.amount, undefined, undefined).paymentInfo(fakeAddress);
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
    const inputTokenSlug = this.inputAsset;
    const inputTokenInfo = this.state.getAssetBySlug(inputTokenSlug);
    const extrinsic = substrateApi.api.tx.vtokenMinting.mint(_getTokenOnChainInfo(inputTokenInfo), data.amount, undefined, undefined);

    return {
      txChain: this.chain,
      extrinsicType: ExtrinsicType.MINT_VDOT,
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

    const extrinsic = substrateApi.api.tx.stablePool.swap(0, 1, 0, amount, weightedMinAmount);

    return [ExtrinsicType.REDEEM_VDOT, extrinsic];
  }

  override async handleYieldUnstake (amount: string, address: string, selectedTarget?: string): Promise<[ExtrinsicType, TransactionData]> {
    const chainApi = await this.substrateApi.isReady;
    const derivativeTokenSlug = this.derivativeAssets[0];
    const derivativeTokenInfo = this.state.getAssetBySlug(derivativeTokenSlug);
    const extrinsic = chainApi.api.tx.vtokenMinting.redeem(_getTokenOnChainInfo(derivativeTokenInfo), amount);

    return [ExtrinsicType.UNSTAKE_VDOT, extrinsic];
  }

  /* Leave pool action */
}
