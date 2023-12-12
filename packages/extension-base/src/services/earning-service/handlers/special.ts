// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { COMMON_CHAIN_SLUGS } from '@subwallet/chain-list';
import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { BasicTxErrorType, ExtrinsicType, RequestCrossChainTransfer, StakingTxErrorType } from '@subwallet/extension-base/background/KoniTypes';
import { createXcmExtrinsic } from '@subwallet/extension-base/koni/api/xcm';
import { YIELD_POOL_STAT_REFRESH_INTERVAL } from '@subwallet/extension-base/koni/api/yield/helper/utils';
import { _getChainNativeTokenSlug } from '@subwallet/extension-base/services/chain-service/utils';
import { BaseYieldStepDetail, HandleYieldStepData, OptimalYieldPath, OptimalYieldPathParams, RuntimeDispatchInfo, SpecialYieldPoolInfo, SubmitYieldJoinData, SubmitYieldStepData, TransactionData, UnstakingInfo, YieldPoolInfo, YieldPoolTarget, YieldProcessValidation, YieldStepType, YieldTokenBaseInfo, YieldValidationStatus } from '@subwallet/extension-base/types';
import BN from 'bn.js';
import { t } from 'i18next';

import { BN_ZERO, noop } from '@polkadot/util';

import { DEFAULT_YIELD_FIRST_STEP, fakeAddress } from '../constants';
import BasePoolHandler from './base';

export default abstract class BaseSpecialStakingPoolHandler extends BasePoolHandler {
  protected abstract altInputAsset: string;
  protected abstract derivativeAssets: string[];
  protected abstract inputAsset: string;
  protected abstract rewardAssets: string[];
  protected abstract feeAssets: string[];
  /** Allow to create default unstake transaction */
  protected readonly allowDefaultUnstake: boolean = false;
  /** Allow to create fast unstake transaction */
  protected readonly allowFastUnstake: boolean = true;

  protected get extraInfo (): Omit<
  SpecialYieldPoolInfo,
  'metadata' |
  'type'
  > {
    return {
      description: this.description,
      name: this.name,
      group: this.group,
      chain: this.chain,
      slug: this.slug,
      altInputAssets: this.altInputAsset,
      derivativeAssets: this.derivativeAssets,
      inputAsset: this.inputAsset,
      rewardAssets: this.rewardAssets,
      feeAssets: this.feeAssets
    };
  }

  override get isPoolSupportAlternativeFee () {
    return this.feeAssets.length > 1;
  }

  /* Subscribe pool info */

  abstract getPoolStat(): Promise<SpecialYieldPoolInfo>;

  async subscribePoolInfo (callback: (data: YieldPoolInfo) => void): Promise<VoidFunction> {
    let cancel = false;

    const getStatInterval = () => {
      this.getPoolStat()
        .then((rs) => {
          if (cancel) {
            callback(rs);
          }
        })
        .catch(console.error);
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

  /* Get pool reward */

  /* Get pool targets */

  async getPoolTargets (): Promise<YieldPoolTarget[]> {
    return new Promise((resolve) => resolve([]));
  }

  /* Get pool targets */

  /* Join pool action */

  /* Generate steps */

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

  /**
   * @async
   * @function getSubmitStepFee
   * */
  async getXcmStep (params: OptimalYieldPathParams): Promise<[BaseYieldStepDetail, YieldTokenBaseInfo] | undefined> {
    const bnAmount = new BN(params.amount);
    const inputTokenSlug = this.inputAsset; // assume that the pool only has 1 input token, will update later
    const inputTokenInfo = this.state.getAssetBySlug(inputTokenSlug);

    const inputTokenBalance = await this.state.balanceService.getTokenFreeBalance(params.address, inputTokenInfo.originChain, inputTokenSlug);

    const bnInputTokenBalance = new BN(inputTokenBalance.value);

    if (!bnInputTokenBalance.gte(bnAmount)) {
      if (this.altInputAsset) {
        const altInputTokenSlug = this.altInputAsset;
        const altInputTokenInfo = this.state.getAssetBySlug(altInputTokenSlug);
        const altInputTokenBalance = await this.state.balanceService.getTokenFreeBalance(params.address, altInputTokenInfo.originChain, altInputTokenSlug);
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
            recipient: fakeAddress,
            chainInfoMap: this.state.getChainInfoMap(),
            substrateApi: xcmOriginSubstrateApi
          });

          const _xcmFeeInfo = await xcmTransfer.paymentInfo(fakeAddress);
          const xcmFeeInfo = _xcmFeeInfo.toPrimitive() as unknown as RuntimeDispatchInfo;
          // TODO: calculate fee for destination chain

          const fee: YieldTokenBaseInfo = {
            slug: altInputTokenSlug,
            amount: (xcmFeeInfo.partialFee * 1.2).toString() // TODO
          };

          return [step, fee];
        }
      }
    }

    return undefined;
  }

  override async generateOptimalPath (params: OptimalYieldPathParams): Promise<OptimalYieldPath> {
    const result: OptimalYieldPath = {
      totalFee: [{ slug: '' }],
      steps: [DEFAULT_YIELD_FIRST_STEP]
    };

    try {
      /* XCM step */

      const xcmStep = await this.getXcmStep(params);

      if (xcmStep) {
        const [step, fee] = xcmStep;

        result.steps.push({
          id: result.steps.length,
          ...step
        });

        result.totalFee.push(fee);
      }

      /* XCM step */

      /* Submit step */

      const submitFee = await this.getSubmitStepFee(params);

      result.steps.push({
        id: result.steps.length,
        ...this.submitJoinStepInfo
      });

      result.totalFee.push(submitFee);

      /* Submit step */

      return result;
    } catch (e) {
      const errorMessage = (e as Error).message;

      if (errorMessage.includes('network')) {
        result.connectionError = errorMessage.split(' ')[0];
      }

      /* Submit step */

      result.steps.push({
        id: result.steps.length,
        ...this.submitJoinStepInfo
      });

      result.totalFee.push({
        slug: this.feeAssets[0],
        amount: '0'
      });

      /* Submit step */

      return result;
    }
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

    if (!bnAmount.gte(new BN(poolInfo.metadata.minJoinPool || '0'))) {
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

  override async validateYieldJoin (params: SubmitYieldJoinData, path: OptimalYieldPath): Promise<TransactionError[]> {
    const inputTokenSlug = this.inputAsset;
    const inputTokenInfo = this.state.getAssetBySlug(inputTokenSlug);
    const balanceService = this.state.balanceService;
    const inputTokenBalance = await balanceService.getTokenFreeBalance(params.address, inputTokenInfo.originChain, inputTokenSlug);
    const bnInputTokenBalance = new BN(inputTokenBalance.value || '0');

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

    if (!poolInfo || !poolPosition) {
      return [new TransactionError(BasicTxErrorType.INTERNAL_ERROR)];
    }

    if (!this.allowDefaultUnstake && !fastLeave) {
      return [new TransactionError(BasicTxErrorType.INTERNAL_ERROR)];
    }

    if (!this.allowFastUnstake && fastLeave) {
      return [new TransactionError(BasicTxErrorType.INTERNAL_ERROR)];
    }

    const errors: TransactionError[] = [];
    const bnActiveStake = new BN(poolPosition.activeStake);
    const bnRemainingStake = bnActiveStake.sub(new BN(amount));
    const minStake = new BN(poolInfo.metadata.minJoinPool || '0');
    const maxUnstake = poolInfo.metadata.maxWithdrawalRequestPerFarmer;

    if (!(bnRemainingStake.isZero() || bnRemainingStake.gte(minStake))) {
      errors.push(new TransactionError(StakingTxErrorType.INVALID_ACTIVE_STAKE));
    }

    if (poolPosition.unstakings.length > maxUnstake) {
      errors.push(new TransactionError(StakingTxErrorType.EXCEED_MAX_UNSTAKING, t('You cannot unstake more than {{number}} times', { replace: { number: maxUnstake } })));
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
