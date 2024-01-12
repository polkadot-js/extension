// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { COMMON_CHAIN_SLUGS } from '@subwallet/chain-list';
import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { BasicTxErrorType, ExtrinsicType, RequestCrossChainTransfer, StakingTxErrorType } from '@subwallet/extension-base/background/KoniTypes';
import { createXcmExtrinsic } from '@subwallet/extension-base/koni/api/xcm';
import { YIELD_POOL_STAT_REFRESH_INTERVAL } from '@subwallet/extension-base/koni/api/yield/helper/utils';
import { _getChainNativeTokenSlug } from '@subwallet/extension-base/services/chain-service/utils';
import { BaseYieldStepDetail, HandleYieldStepData, OptimalYieldPath, OptimalYieldPathParams, RequestEarlyValidateYield, ResponseEarlyValidateYield, RuntimeDispatchInfo, SpecialYieldPoolInfo, SpecialYieldPoolMetadata, SubmitYieldJoinData, SubmitYieldStepData, TransactionData, UnstakingInfo, YieldPoolInfo, YieldPoolTarget, YieldPoolType, YieldProcessValidation, YieldStepBaseInfo, YieldStepType, YieldTokenBaseInfo, YieldValidationStatus } from '@subwallet/extension-base/types';
import { t } from 'i18next';

import { BN, BN_ZERO, noop } from '@polkadot/util';

import BasePoolHandler from './base';

export default abstract class BaseSpecialStakingPoolHandler extends BasePoolHandler {
  protected abstract altInputAsset: string;
  protected abstract derivativeAssets: string[];
  protected abstract inputAsset: string;
  protected abstract rewardAssets: string[];
  protected abstract feeAssets: string[];
  /** Pool's type */
  public abstract override type: YieldPoolType.LIQUID_STAKING | YieldPoolType.LENDING;

  protected override get metadataInfo (): Omit<SpecialYieldPoolMetadata, 'description'> {
    return {
      altInputAssets: this.altInputAsset,
      derivativeAssets: this.derivativeAssets,
      inputAsset: this.inputAsset,
      rewardAssets: this.rewardAssets,
      feeAssets: this.feeAssets,
      logo: this.logo,
      shortName: this.shortName,
      name: this.name,
      isAvailable: true,
      maintainAsset: this.nativeToken.slug,
      maintainBalance: this.maintainBalance,
      availableMethod: this.availableMethod
    };
  }

  override get isPoolSupportAlternativeFee () {
    return this.feeAssets.length > 1;
  }

  override async earlyValidate (request: RequestEarlyValidateYield): Promise<ResponseEarlyValidateYield> {
    const poolInfo = await this.getPoolInfo();

    if (!poolInfo || !poolInfo.statistic?.earningThreshold.join) {
      return {
        passed: false,
        errorMessage: 'There\'s a trouble fetching data, please check your internet connection and try again'
      };
    }

    const feeAssetInfo = this.state.chainService.getAssetBySlug(this.feeAssets[0]);
    const altInputAssetInfo = this.state.chainService.getAssetBySlug(this.altInputAsset);
    const inputAssetInfo = this.state.chainService.getAssetBySlug(this.inputAsset);

    const [inputAssetBalance, altInputAssetBalance, feeAssetBalance] = await Promise.all([
      this.state.balanceService.getTokenFreeBalance(request.address, inputAssetInfo.originChain, inputAssetInfo.slug),
      this.state.balanceService.getTokenFreeBalance(request.address, inputAssetInfo.originChain, altInputAssetInfo.slug),
      this.state.balanceService.getTokenFreeBalance(request.address, inputAssetInfo.originChain, feeAssetInfo.slug)
    ]);

    const bnInputAssetBalance = new BN(inputAssetBalance.value);
    const bnAltInputAssetBalance = new BN(altInputAssetBalance.value);
    const bnMinJoinPool = new BN(poolInfo.statistic.earningThreshold.join);

    const inputTokenInfo = this.state.chainService.getAssetBySlug(this.inputAsset);
    const altInputTokenInfo = this.state.chainService.getAssetBySlug(this.altInputAsset);
    const parsedMinJoinPool = bnMinJoinPool.divn(10 ** (altInputTokenInfo.decimals || 0));

    if (bnInputAssetBalance.add(bnAltInputAssetBalance).lt(bnMinJoinPool)) {
      return {
        passed: false,
        errorMessage: `You need at least ${parsedMinJoinPool.toString()} ${inputTokenInfo.symbol} (${inputTokenInfo.originChain}) or ${altInputTokenInfo.symbol} (${altInputTokenInfo.originChain}) to start earning`
      };
    }

    if (this.feeAssets.length === 1) {
      const bnFeeAssetBalance = new BN(feeAssetBalance.value);
      const minFeeAssetBalance = new BN(feeAssetInfo.minAmount || '0');
      const parsedMinFeeAssetBalance = minFeeAssetBalance.divn(10 ** (feeAssetInfo.decimals || 0)).muln(1.2);

      if (bnFeeAssetBalance.lte(BN_ZERO)) {
        return {
          passed: false,
          errorMessage: `You need at least ${parsedMinFeeAssetBalance.toString()} ${feeAssetInfo.symbol} (${feeAssetInfo.originChain}) to start earning`
        };
      }
    }

    return {
      passed: true
    };
  }

  override get group (): string {
    const inputAsset = this.state.getAssetBySlug(this.inputAsset);
    const groupSlug = inputAsset.multiChainAsset;

    return groupSlug || this.inputAsset;
  }

  /* Subscribe pool info */

  abstract getPoolStat (): Promise<SpecialYieldPoolInfo>;

  async subscribePoolInfo (callback: (data: YieldPoolInfo) => void): Promise<VoidFunction> {
    let cancel = false;

    const getStatInterval = () => {
      if (!this.isActive) {
        if (!cancel) {
          const rs: SpecialYieldPoolInfo = {
            ...this.baseInfo,
            type: this.type,
            metadata: {
              ...this.metadataInfo,
              description: this.getDescription()
            }
          };

          callback(rs);
        }
      } else {
        this.getPoolStat()
          .then((rs) => {
            if (!cancel) {
              callback(rs);
            }
          })
          .catch(console.error);
      }
    };

    getStatInterval();

    const interval = setInterval(() => {
      if (cancel) {
        clearInterval(interval);
      } else {
        getStatInterval();
      }
    }, YIELD_POOL_STAT_REFRESH_INTERVAL);

    return new Promise<VoidFunction>((resolve) => {
      const rs = () => {
        cancel = true;
        clearInterval(interval);
      };

      resolve(rs);
    });
  }

  /* Subscribe pool info */

  /* Get pool reward */

  async getPoolReward (): Promise<VoidFunction> {
    return new Promise((resolve) => resolve(noop));
  }

  async getPoolRewardHistory (): Promise<VoidFunction> {
    return new Promise((resolve) => resolve(noop));
  }

  /* Get pool reward */

  /* Get pool targets */

  async getPoolTargets (): Promise<YieldPoolTarget[]> {
    return new Promise((resolve) => resolve([]));
  }

  /* Get pool targets */

  /* Join pool action */

  /* Generate steps */

  /**
   * @async
   * @function getXcmStep
   * */
  override async getXcmStep (params: OptimalYieldPathParams): Promise<[BaseYieldStepDetail, YieldTokenBaseInfo] | undefined> {
    const { address, amount } = params;
    const bnAmount = new BN(amount);
    const inputTokenSlug = this.inputAsset; // assume that the pool only has 1 input token, will update later
    const inputTokenInfo = this.state.getAssetBySlug(inputTokenSlug);

    const inputTokenBalance = await this.state.balanceService.getTokenFreeBalance(address, inputTokenInfo.originChain, inputTokenSlug);

    const bnInputTokenBalance = new BN(inputTokenBalance.value);

    if (!bnInputTokenBalance.gte(bnAmount)) {
      if (this.altInputAsset) {
        const altInputTokenSlug = this.altInputAsset;
        const altInputTokenInfo = this.state.getAssetBySlug(altInputTokenSlug);
        const altInputTokenBalance = await this.state.balanceService.getTokenFreeBalance(address, altInputTokenInfo.originChain, altInputTokenSlug);
        const bnAltInputTokenBalance = new BN(altInputTokenBalance.value || '0');

        if (bnAltInputTokenBalance.gt(BN_ZERO)) {
          const step: BaseYieldStepDetail = {
            metadata: {
              sendingValue: bnAmount.toString(),
              originTokenInfo: altInputTokenInfo,
              destinationTokenInfo: inputTokenInfo
            },
            name: 'Transfer DOT from Polkadot',
            type: YieldStepType.XCM
          };

          const xcmOriginSubstrateApi = await this.state.getSubstrateApi(altInputTokenInfo.originChain).isReady;

          const xcmTransfer = await createXcmExtrinsic({
            originTokenInfo: altInputTokenInfo,
            destinationTokenInfo: inputTokenInfo,
            sendingValue: bnAmount.toString(),
            recipient: address,
            chainInfoMap: this.state.getChainInfoMap(),
            substrateApi: xcmOriginSubstrateApi
          });

          const _xcmFeeInfo = await xcmTransfer.paymentInfo(address);
          const xcmFeeInfo = _xcmFeeInfo.toPrimitive() as unknown as RuntimeDispatchInfo;
          // TODO: calculate fee for destination chain

          const fee: YieldTokenBaseInfo = {
            slug: altInputTokenSlug,
            amount: Math.round(xcmFeeInfo.partialFee * 1.2).toString() // TODO
          };

          return [step, fee];
        }
      }
    }

    return undefined;
  }

  protected get defaultSubmitStep (): YieldStepBaseInfo {
    return [
      this.submitJoinStepInfo,
      {
        slug: this.feeAssets[0],
        amount: '0'
      }
    ];
  }

  /**
   * @function submitJoinStepInfo
   * @description Base info of submit step
   * @return Fee of the submitting step
   * */
  abstract get submitJoinStepInfo(): BaseYieldStepDetail;

  /**
   * @async
   * @function getSubmitStepFee
   * @description Get submit step fee
   * @return {Promise<YieldTokenBaseInfo>} Fee of the submitting step
   * */
  abstract getSubmitStepFee(params: OptimalYieldPathParams): Promise<YieldTokenBaseInfo>;

  protected async getSubmitStep (params: OptimalYieldPathParams): Promise<YieldStepBaseInfo> {
    const fee = await this.getSubmitStepFee(params);

    return [this.submitJoinStepInfo, fee];
  }

  /* Generate steps */

  /* Validate join action */

  protected async validateTokenApproveStep (params: OptimalYieldPathParams, path: OptimalYieldPath): Promise<TransactionError[]> {
    return Promise.resolve([new TransactionError(BasicTxErrorType.UNSUPPORTED)]);
  }

  protected async validateXcmStep (params: OptimalYieldPathParams, path: OptimalYieldPath, bnInputTokenBalance: BN): Promise<TransactionError[]> {
    const processValidation: YieldProcessValidation = {
      ok: true,
      status: YieldValidationStatus.OK
    };

    const bnAmount = new BN(params.amount);

    const altInputTokenSlug = this.altInputAsset || '';
    const altInputTokenInfo = this.state.getAssetBySlug(altInputTokenSlug);
    const altInputTokenBalance = await this.state.balanceService.getTokenFreeBalance(params.address, altInputTokenInfo.originChain, altInputTokenSlug);

    const missingAmount = bnAmount.sub(bnInputTokenBalance); // TODO: what if input token is not LOCAL ??
    const xcmFee = new BN(path.totalFee[1].amount || '0');
    const xcmAmount = missingAmount.add(xcmFee);

    const bnAltInputTokenBalance = new BN(altInputTokenBalance.value || '0');
    const altInputTokenMinAmount = new BN(altInputTokenInfo.minAmount || '0');

    if (!bnAltInputTokenBalance.sub(xcmAmount).gte(altInputTokenMinAmount)) {
      processValidation.failedStep = path.steps[1];
      processValidation.ok = false;
      processValidation.status = YieldValidationStatus.NOT_ENOUGH_BALANCE;

      return [new TransactionError(YieldValidationStatus.NOT_ENOUGH_BALANCE, processValidation.message, processValidation)];
    }

    return [];
  }

  protected async validateJoinStep (id: number, params: OptimalYieldPathParams, path: OptimalYieldPath, bnInputTokenBalance: BN, isXcmOk: boolean): Promise<TransactionError[]> {
    const _poolInfo = await this.getPoolInfo();

    if (!_poolInfo) {
      return [new TransactionError(BasicTxErrorType.INTERNAL_ERROR)];
    }

    const poolInfo = _poolInfo as SpecialYieldPoolInfo;

    if (!poolInfo.statistic) {
      return [new TransactionError(BasicTxErrorType.INTERNAL_ERROR)];
    }

    const processValidation: YieldProcessValidation = {
      ok: true,
      status: YieldValidationStatus.OK
    };
    const feeTokenSlug = path.totalFee[id].slug;
    const feeTokenInfo = this.state.getAssetBySlug(feeTokenSlug);
    const defaultFeeTokenSlug = this.feeAssets[0];
    const bnAmount = new BN(params.amount);

    if (this.feeAssets.length === 1 && feeTokenSlug === defaultFeeTokenSlug) {
      const bnFeeAmount = new BN(path.totalFee[id]?.amount || '0');
      const feeTokenBalance = await this.state.balanceService.getTokenFreeBalance(params.address, feeTokenInfo.originChain, feeTokenSlug);
      const bnFeeTokenBalance = new BN(feeTokenBalance.value || '0');
      const bnFeeTokenMinAmount = new BN(feeTokenInfo?.minAmount || '0');

      if (!bnFeeTokenBalance.sub(bnFeeAmount).gte(bnFeeTokenMinAmount)) {
        processValidation.failedStep = path.steps[id];
        processValidation.ok = false;
        processValidation.status = YieldValidationStatus.NOT_ENOUGH_FEE;

        return [new TransactionError(YieldValidationStatus.NOT_ENOUGH_FEE, processValidation.message, processValidation)];
      }
    }

    if (!bnAmount.gte(new BN(poolInfo.statistic.earningThreshold.join || '0'))) {
      processValidation.failedStep = path.steps[id];
      processValidation.ok = false;
      processValidation.status = YieldValidationStatus.NOT_ENOUGH_MIN_JOIN_POOL;

      return [new TransactionError(YieldValidationStatus.NOT_ENOUGH_MIN_JOIN_POOL, processValidation.message, processValidation)];
    }

    if (!isXcmOk && bnAmount.gt(bnInputTokenBalance)) {
      processValidation.failedStep = path.steps[id];
      processValidation.ok = false;
      processValidation.status = YieldValidationStatus.NOT_ENOUGH_BALANCE;

      return [new TransactionError(YieldValidationStatus.NOT_ENOUGH_BALANCE, processValidation.message, processValidation)];
    }

    return [];
  }

  async validateYieldJoin (params: SubmitYieldJoinData, path: OptimalYieldPath): Promise<TransactionError[]> {
    const inputTokenSlug = this.inputAsset;
    const inputTokenInfo = this.state.getAssetBySlug(inputTokenSlug);
    const balanceService = this.state.balanceService;
    const inputTokenBalance = await balanceService.getTokenFreeBalance(params.address, inputTokenInfo.originChain, inputTokenSlug);
    const bnInputTokenBalance = new BN(inputTokenBalance.value || '0');
    const bnAmount = new BN(params.amount);

    if (bnAmount.lte(BN_ZERO)) {
      return [new TransactionError(BasicTxErrorType.INVALID_PARAMS, 'Amount must be greater than 0')];
    }

    let isXcmOk = false;

    for (const step of path.steps) {
      const getErrors = async (): Promise<TransactionError[]> => {
        switch (step.type) {
          case YieldStepType.DEFAULT:
            return Promise.resolve([]);
          case YieldStepType.XCM:
            return this.validateXcmStep(params, path, bnInputTokenBalance);
          case YieldStepType.TOKEN_APPROVAL:
            return this.validateTokenApproveStep(params, path);
          default:
            return this.validateJoinStep(step.id, params, path, bnInputTokenBalance, isXcmOk);
        }
      };

      const errors = await getErrors();

      if (errors.length) {
        return errors;
      } else if (step.type === YieldStepType.XCM) {
        isXcmOk = true;
      }
    }

    return [];
  }

  /* Validate join action */

  /* Submit join action */

  protected async handleTokenApproveStep (data: SubmitYieldJoinData, path: OptimalYieldPath): Promise<HandleYieldStepData> {
    return Promise.reject(new TransactionError(BasicTxErrorType.UNSUPPORTED));
  }

  async handleXcmStep (data: SubmitYieldJoinData, path: OptimalYieldPath, xcmFee: string): Promise<HandleYieldStepData> {
    const { address, amount } = data as SubmitYieldStepData;

    const destinationTokenSlug = this.inputAsset;
    const originChainInfo = this.state.getChainInfo(COMMON_CHAIN_SLUGS.POLKADOT);
    const originTokenSlug = _getChainNativeTokenSlug(originChainInfo);
    const originTokenInfo = this.state.getAssetBySlug(originTokenSlug);
    const destinationTokenInfo = this.state.getAssetBySlug(destinationTokenSlug);
    const substrateApi = this.state.getSubstrateApi(originChainInfo.slug);

    const inputTokenBalance = await this.state.balanceService.getTokenFreeBalance(address, destinationTokenInfo.originChain, destinationTokenSlug);
    const bnInputTokenBalance = new BN(inputTokenBalance.value);

    const bnXcmFee = new BN(xcmFee);
    const bnAmount = new BN(amount);

    const bnTotalAmount = bnAmount.sub(bnInputTokenBalance).add(bnXcmFee);

    const extrinsic = await createXcmExtrinsic({
      chainInfoMap: this.state.getChainInfoMap(),
      destinationTokenInfo,
      originTokenInfo,
      recipient: address,
      sendingValue: bnTotalAmount.toString(),
      substrateApi
    });

    const xcmData: RequestCrossChainTransfer = {
      originNetworkKey: originChainInfo.slug,
      destinationNetworkKey: destinationTokenInfo.originChain,
      from: address,
      to: address,
      value: bnTotalAmount.toString(),
      tokenSlug: originTokenSlug,
      showExtraWarning: true
    };

    return {
      txChain: originChainInfo.slug,
      extrinsicType: ExtrinsicType.TRANSFER_XCM,
      extrinsic,
      txData: xcmData,
      transferNativeAmount: bnTotalAmount.toString()
    };
  }

  abstract handleSubmitStep (data: SubmitYieldJoinData, path: OptimalYieldPath): Promise<HandleYieldStepData>;

  override handleYieldJoin (data: SubmitYieldJoinData, path: OptimalYieldPath, currentStep: number): Promise<HandleYieldStepData> {
    const type = path.steps[currentStep].type;

    switch (type) {
      case YieldStepType.DEFAULT:
        return Promise.reject(new TransactionError(BasicTxErrorType.UNSUPPORTED));
      case YieldStepType.TOKEN_APPROVAL:
        return this.handleTokenApproveStep(data, path);

      case YieldStepType.XCM: {
        const xcmFee = path.totalFee[currentStep].amount || '0';

        return this.handleXcmStep(data, path, xcmFee);
      }

      default:
        return this.handleSubmitStep(data, path);
    }
  }

  /* Submit join action */

  /* Join pool action */

  /* Leave pool action */

  async validateYieldLeave (amount: string, address: string, fastLeave: boolean, selectedTarget?: string): Promise<TransactionError[]> {
    const poolInfo = await this.getPoolInfo();
    const poolPosition = await this.getPoolPosition(address);

    if (!poolInfo || !poolInfo.statistic || !poolPosition) {
      return [new TransactionError(BasicTxErrorType.INTERNAL_ERROR)];
    }

    if (!this.availableMethod.defaultUnstake && !fastLeave) {
      return [new TransactionError(BasicTxErrorType.INTERNAL_ERROR)];
    }

    if (!this.availableMethod.fastUnstake && fastLeave) {
      return [new TransactionError(BasicTxErrorType.INTERNAL_ERROR)];
    }

    const errors: TransactionError[] = [];
    const bnActiveStake = new BN(poolPosition.activeStake);
    const bnAmount = new BN(amount);
    const bnRemainingStake = bnActiveStake.sub(bnAmount);
    const minStake = new BN(poolInfo.statistic.earningThreshold.join || '0');
    const minUnstake = new BN((fastLeave ? poolInfo.statistic.earningThreshold.fastUnstake : poolInfo.statistic.earningThreshold.defaultUnstake) || '0');
    const maxUnstakeRequest = poolInfo.statistic.maxWithdrawalRequestPerFarmer;

    const derivativeTokenInfo = this.state.getAssetBySlug(this.derivativeAssets[0]);

    if (bnAmount.lte(BN_ZERO)) {
      return [new TransactionError(BasicTxErrorType.INVALID_PARAMS, t('Amount must be greater than 0'))];
    }

    if (bnAmount.lt(minUnstake)) {
      const parsedMinUnstake = minUnstake.divn(10 ** (derivativeTokenInfo.decimals || 0));

      errors.push(new TransactionError(StakingTxErrorType.NOT_ENOUGH_MIN_UNSTAKE, t('You need to unstake at least {{amount}} {{token}}', { replace: { amount: parsedMinUnstake.toString(), token: derivativeTokenInfo.symbol } })));
    }

    if (!fastLeave) {
      if (!(bnRemainingStake.isZero() || bnRemainingStake.gte(minStake))) {
        errors.push(new TransactionError(StakingTxErrorType.INVALID_ACTIVE_STAKE)); // TODO
      }

      if (poolPosition.unstakings.length > maxUnstakeRequest) {
        errors.push(new TransactionError(StakingTxErrorType.EXCEED_MAX_UNSTAKING, t('You cannot unstake more than {{number}} times', { replace: { number: maxUnstakeRequest } })));
      }
    }

    return Promise.resolve(errors);
  }

  handleYieldUnstake (amount: string, address: string, selectedTarget?: string): Promise<[ExtrinsicType, TransactionData]> {
    return Promise.reject(new TransactionError(BasicTxErrorType.UNSUPPORTED));
  }

  /* Leave pool action */

  /* Other action */

  handleYieldCancelUnstake (): Promise<TransactionData> {
    return Promise.reject(new TransactionError(BasicTxErrorType.UNSUPPORTED));
  }

  handleYieldClaimReward (address: string, bondReward?: boolean): Promise<TransactionData> {
    return Promise.reject(new TransactionError(BasicTxErrorType.UNSUPPORTED));
  }

  handleYieldWithdraw (address: string, unstakingInfo: UnstakingInfo): Promise<TransactionData> {
    return Promise.reject(new TransactionError(BasicTxErrorType.UNSUPPORTED));
  }

  /* Other actions */
}
