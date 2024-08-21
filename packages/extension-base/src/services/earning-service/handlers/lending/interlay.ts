// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { BasicTxErrorType, ChainType, ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import KoniState from '@subwallet/extension-base/koni/background/handlers/State';
import { _getTokenOnChainInfo } from '@subwallet/extension-base/services/chain-service/utils';
import { BaseYieldStepDetail, EarningStatus, HandleYieldStepData, LendingYieldPoolInfo, LendingYieldPositionInfo, OptimalYieldPath, OptimalYieldPathParams, RuntimeDispatchInfo, SubmitYieldJoinData, TokenBalanceRaw, TransactionData, YieldPoolMethodInfo, YieldPositionInfo, YieldStepType, YieldTokenBaseInfo } from '@subwallet/extension-base/types';

import { BN, BN_TEN, BN_ZERO } from '@polkadot/util';

import { fakeAddress } from '../../constants';
import BaseLendingPoolHandler from './base';

export default class InterlayLendingPoolHandler extends BaseLendingPoolHandler {
  public slug: string;
  protected readonly name: string;
  protected readonly shortName: string;
  protected readonly altInputAsset: string = 'polkadot-NATIVE-DOT';
  protected readonly derivativeAssets: string[] = ['interlay-LOCAL-qDOT'];
  protected readonly inputAsset: string = 'interlay-LOCAL-DOT';
  protected readonly rewardAssets: string[] = ['interlay-LOCAL-DOT'];
  protected readonly feeAssets: string[] = ['interlay-NATIVE-INTR', 'interlay-LOCAL-DOT'];
  protected readonly availableMethod: YieldPoolMethodInfo = {
    join: true,
    defaultUnstake: false,
    fastUnstake: true,
    cancelUnstake: false,
    withdraw: false,
    claimReward: false
  };

  protected readonly rateDecimals = 18;

  constructor (state: KoniState, chain: string) {
    super(state, chain);

    const chainInfo = this.chainInfo;

    this.slug = `DOT___lending___${chain}`;
    this.name = `${chainInfo.name} Lending`;
    this.shortName = chainInfo.name.replaceAll(' Relay Chain', '');
  }

  protected getDescription (): string {
    return 'Earn rewards by lending DOT';
  }

  /* Subscribe pool info */

  async getPoolStat (): Promise<LendingYieldPoolInfo> {
    const substrateApi = await this.substrateApi.isReady;

    const inputTokenSlug = this.inputAsset;
    const inputTokenInfo = this.state.getAssetBySlug(inputTokenSlug);

    const _exchangeRate = await substrateApi.api.query.loans.exchangeRate(_getTokenOnChainInfo(inputTokenInfo));

    const exchangeRate = _exchangeRate.toPrimitive() as number;
    const decimals = 10 ** this.rateDecimals;

    this.updateExchangeRate(exchangeRate);

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
            apr: 1.29,
            exchangeRate: exchangeRate / decimals
          }
        ],
        maxCandidatePerFarmer: 1,
        maxWithdrawalRequestPerFarmer: 1,
        earningThreshold: {
          join: '10000000000',
          defaultUnstake: '0',
          fastUnstake: '0'
        },
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

    const unsub = await substrateApi.api.query.tokens.accounts.multi(useAddresses.map((address) => [address, _getTokenOnChainInfo(derivativeTokenInfo)]), async (_balances) => {
      if (cancel) {
        unsub();

        return;
      }

      const exchangeRate = await this.getExchangeRate();
      const decimals = BN_TEN.pow(new BN(this.rateDecimals));
      const balances = _balances as unknown as TokenBalanceRaw[];

      for (let i = 0; i < balances.length; i++) {
        const balanceItem = balances[i];
        const address = useAddresses[i];
        const bnActiveBalance = balanceItem.reserved || BN_ZERO;
        const bnTotalBalance = bnActiveBalance.mul(new BN(exchangeRate)).div(decimals);

        const result: LendingYieldPositionInfo = {
          ...this.baseInfo,
          type: this.type,
          address,
          balanceToken: this.inputAsset,
          totalStake: bnTotalBalance.toString(),
          activeStake: bnActiveBalance.toString(),
          unstakeBalance: '0',
          status: bnActiveBalance.gt(BN_ZERO) ? EarningStatus.EARNING_REWARD : EarningStatus.NOT_EARNING,
          derivativeToken: derivativeTokenSlug,
          isBondedBefore: bnTotalBalance.gt(BN_ZERO),
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
      name: 'Mint qDOT',
      type: YieldStepType.MINT_QDOT
    };
  }

  async getSubmitStepFee (params: OptimalYieldPathParams): Promise<YieldTokenBaseInfo> {
    const poolOriginSubstrateApi = await this.substrateApi.isReady;
    const inputTokenSlug = this.inputAsset;
    const inputTokenInfo = this.state.getAssetBySlug(inputTokenSlug);
    const defaultFeeTokenSlug = this.feeAssets[0];

    if (new BN(params.amount).gt(BN_ZERO)) {
      const _mintFeeInfo = await poolOriginSubstrateApi.api.tx.loans.mint(_getTokenOnChainInfo(inputTokenInfo), params.amount).paymentInfo(fakeAddress);
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
    const extrinsic = substrateApi.api.tx.loans.mint(_getTokenOnChainInfo(inputTokenInfo), data.amount);

    return {
      txChain: this.chain,
      extrinsicType: ExtrinsicType.MINT_QDOT,
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
    // @ts-ignore
    const inputTokenSlug = this.inputAsset;
    const inputTokenInfo = this.state.getAssetBySlug(inputTokenSlug);
    const yieldPositionInfo = await this.getPoolPosition(address);

    if (!yieldPositionInfo) {
      return Promise.reject(new TransactionError(BasicTxErrorType.INVALID_PARAMS));
    }

    const bnAmount = new BN(amount);
    const bnActiveBalance = new BN(yieldPositionInfo.activeStake);

    const redeemAll = bnAmount.eq(bnActiveBalance);

    const extrinsic = !redeemAll
      ? substrateApi.api.tx.loans.redeem(_getTokenOnChainInfo(inputTokenInfo), amount)
      : substrateApi.api.tx.loans.redeemAll(_getTokenOnChainInfo(inputTokenInfo));

    return [ExtrinsicType.REDEEM_QDOT, extrinsic];
  }

  /* Leave pool action */
}
