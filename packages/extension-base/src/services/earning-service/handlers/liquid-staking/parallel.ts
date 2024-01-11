// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { PalletStakingStakingLedger } from '@subwallet/extension-base/koni/api/staking/bonding/relayChain';
import KoniState from '@subwallet/extension-base/koni/background/handlers/State';
import { _STAKING_ERA_LENGTH_MAP } from '@subwallet/extension-base/services/chain-service/constants';
import { _getTokenOnChainAssetId } from '@subwallet/extension-base/services/chain-service/utils';
import { fakeAddress } from '@subwallet/extension-base/services/earning-service/constants';
import { BaseYieldStepDetail, EarningStatus, HandleYieldStepData, LiquidYieldPoolInfo, OptimalYieldPath, OptimalYieldPathParams, RuntimeDispatchInfo, SubmitYieldJoinData, TransactionData, UnlockingChunk, UnstakingInfo, UnstakingStatus, YieldPoolMethodInfo, YieldPositionInfo, YieldStepType, YieldTokenBaseInfo } from '@subwallet/extension-base/types';

import { BN, BN_ZERO } from '@polkadot/util';

import BaseLiquidStakingPoolHandler from './base';

interface BlockHeader {
  number: number
}

export default class ParallelLiquidStakingPoolHandler extends BaseLiquidStakingPoolHandler {
  public slug: string;
  protected readonly name: string;
  protected readonly shortName: string;
  protected readonly altInputAsset: string = 'polkadot-NATIVE-DOT';
  protected readonly derivativeAssets: string[] = ['parallel-LOCAL-sDOT'];
  protected readonly inputAsset: string = 'parallel-LOCAL-DOT';
  protected readonly rewardAssets: string[] = ['parallel-LOCAL-DOT'];
  protected readonly feeAssets: string[] = ['parallel-NATIVE-PARA'];
  public override readonly minAmountPercent = 0.97;
  protected readonly availableMethod: YieldPoolMethodInfo = {
    join: true,
    defaultUnstake: true,
    fastUnstake: true,
    cancelUnstake: false,
    withdraw: false,
    claimReward: false
  };

  constructor (state: KoniState, chain: string) {
    super(state, chain);

    const chainInfo = this.chainInfo;

    this.slug = `DOT___liquid_staking___${chain}`;
    this.name = `${chainInfo.name} Liquid Staking`;
    this.shortName = chainInfo.name.replaceAll(' Relay Chain', '');
  }

  protected getDescription (): string {
    return 'Stake DOT to earn yield on sDOT';
  }

  /* Subscribe pool info */

  async getPoolStat (): Promise<LiquidYieldPoolInfo> {
    const substrateApi = await this.substrateApi.isReady;

    const [_exchangeRate, _currentBlockHeader, _currentTimestamp, _stakingLedgers] = await Promise.all([
      substrateApi.api.query.liquidStaking.exchangeRate(),
      substrateApi.api.rpc.chain.getHeader(),
      substrateApi.api.query.timestamp.now(),
      substrateApi.api.query.liquidStaking.stakingLedgers.entries()
    ]);

    let tvl = BN_ZERO;

    for (const _stakingLedger of _stakingLedgers) {
      const _ledger = _stakingLedger[1];
      const ledger = _ledger.toPrimitive() as unknown as PalletStakingStakingLedger;

      tvl = tvl.add(new BN(ledger.total.toString()));
    }

    const exchangeRate = _exchangeRate.toPrimitive() as number;
    const currentBlockHeader = _currentBlockHeader.toPrimitive() as unknown as BlockHeader;
    const currentTimestamp = _currentTimestamp.toPrimitive() as number;

    const beginBlock = currentBlockHeader.number - ((24 * 60 * 60) / 6) * 14;
    const _beginBlockHash = await substrateApi.api.rpc.chain.getBlockHash(beginBlock);
    const beginBlockHash = _beginBlockHash.toString();

    const [_beginTimestamp, _beginExchangeRate] = await Promise.all([
      substrateApi.api.query.timestamp.now.at(beginBlockHash),
      substrateApi.api.query.liquidStaking.exchangeRate.at(beginBlockHash)
    ]);

    const beginTimestamp = _beginTimestamp.toPrimitive() as number;
    const beginExchangeRate = _beginExchangeRate.toPrimitive() as number;
    const decimals = 10 ** 18;

    const apy = (exchangeRate / beginExchangeRate) ** (365 * 24 * 60 * 60000 / (currentTimestamp - beginTimestamp)) - 1;

    const minStake = substrateApi.api.consts.liquidStaking.minStake.toString();
    const minUnstake = substrateApi.api.consts.liquidStaking.minUnstake.toString();

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
            exchangeRate: exchangeRate / decimals
          }
        ],
        unstakingPeriod: 24 * 28,
        maxCandidatePerFarmer: 1,
        maxWithdrawalRequestPerFarmer: 1,
        earningThreshold: {
          join: minStake,
          defaultUnstake: minUnstake,
          fastUnstake: minUnstake
        },
        totalApy: apy * 100,
        tvl: tvl.toString()
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

    const unsub = await substrateApi.api.query.assets.account.multi(useAddresses.map((address) => [_getTokenOnChainAssetId(derivativeTokenInfo), address]), async (balances) => {
      if (cancel) {
        unsub();

        return;
      }

      const unlockingChunks = await substrateApi.api.query.liquidStaking.unlockings.multi(useAddresses);
      const _currentEra = await substrateApi.api.query.liquidStaking.currentEra();
      const currentEra = _currentEra.toPrimitive() as number;

      for (let i = 0; i < balances.length; i++) {
        const b = balances[i];
        const address = useAddresses[i];
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
        const bdata = b?.toHuman();
        const chunks = unlockingChunks[i].toPrimitive() as unknown as UnlockingChunk[];

        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-argument
        const activeBalance = bdata && bdata.balance ? new BN(String(bdata?.balance).replaceAll(',', '') || '0') : BN_ZERO;
        let totalBalance = activeBalance;
        let unlockingBalance = BN_ZERO;
        const unstakings: UnstakingInfo[] = [];

        if (chunks) {
          for (const chunk of chunks) {
            const amount = new BN(chunk.value);
            const isClaimable = chunk.era - currentEra < 0;
            const remainingEra = chunk.era - currentEra;
            const eraTime = _STAKING_ERA_LENGTH_MAP[this.chain] || _STAKING_ERA_LENGTH_MAP.default;
            const waitingTime = remainingEra * eraTime;

            totalBalance = totalBalance.add(amount);
            unlockingBalance = unlockingBalance.add(amount);
            unstakings.push({
              chain: this.chain,
              status: isClaimable ? UnstakingStatus.CLAIMABLE : UnstakingStatus.UNLOCKING,
              claimable: amount.toString(),
              waitingTime: waitingTime
            } as UnstakingInfo);
          }
        }

        const result: YieldPositionInfo = {
          ...this.baseInfo,
          type: this.type,
          address,
          balanceToken: this.inputAsset,
          totalStake: totalBalance.toString(),
          activeStake: activeBalance.toString(),
          unstakeBalance: unlockingBalance.toString(),
          status: EarningStatus.EARNING_REWARD,
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
      name: 'Mint sDOT',
      type: YieldStepType.MINT_SDOT
    };
  }

  async getSubmitStepFee (params: OptimalYieldPathParams): Promise<YieldTokenBaseInfo> {
    const poolOriginSubstrateApi = await this.substrateApi.isReady;
    const defaultFeeTokenSlug = this.feeAssets[0];

    if (new BN(params.amount).gt(BN_ZERO)) {
      const _mintFeeInfo = await poolOriginSubstrateApi.api.tx.liquidStaking.stake(params.amount).paymentInfo(fakeAddress);
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
    const extrinsic = substrateApi.api.tx.liquidStaking.stake(data.amount);

    return {
      txChain: this.chain,
      extrinsicType: ExtrinsicType.MINT_SDOT,
      extrinsic,
      txData: data,
      transferNativeAmount: '0'
    };
  }

  /* Join pool action */

  /* Leave pool action */

  async handleYieldRedeem (amount: string, address: string, selectedTarget?: string): Promise<[ExtrinsicType, TransactionData]> {
    const substrateApi = await this.substrateApi.isReady;
    const weightedMinAmount = await this.createParamToRedeem(amount, address);

    const extrinsic = substrateApi.api.tx.ammRoute.swapExactTokensForTokens(['1001', '101'], amount, weightedMinAmount);

    return [ExtrinsicType.REDEEM_SDOT, extrinsic];
  }

  override async handleYieldUnstake (amount: string, address: string, selectedTarget?: string): Promise<[ExtrinsicType, TransactionData]> {
    const chainApi = await this.substrateApi.isReady;

    const extrinsic = chainApi.api.tx.liquidStaking.unstake(amount, 'RelayChain');

    return [ExtrinsicType.UNSTAKE_SDOT, extrinsic];
  }

  /* Leave pool action */
}
