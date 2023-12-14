// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { ExtrinsicType, StakeCancelWithdrawalParams } from '@subwallet/extension-base/background/KoniTypes';
import KoniState from '@subwallet/extension-base/koni/background/handlers/State';
import { _EvmApi, _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { DEFAULT_YIELD_FIRST_STEP } from '@subwallet/extension-base/services/earning-service/constants';
import { EarningRewardItem, GenStepFunction, HandleYieldStepData, OptimalYieldPath, OptimalYieldPathParams, SubmitYieldJoinData, TransactionData, UnstakingInfo, YieldPoolGroup, YieldPoolInfo, YieldPoolTarget, YieldPoolType, YieldPositionInfo, YieldStepBaseInfo, YieldTokenBaseInfo } from '@subwallet/extension-base/types';

/**
 * @class BasePoolHandler
 * @description Base pool handler
 * */
export default abstract class BasePoolHandler {
  /** Koni state */
  protected readonly state: KoniState;

  /** Pool's chain */
  public readonly chain: string;

  /** Pool's slug */
  public abstract slug: string;

  /** Pool's type */
  public abstract type: YieldPoolType;

  /** Pool's group */
  protected abstract group: YieldPoolGroup;

  /** Pool's name */
  protected abstract name: string;

  /** Pool's description */
  protected abstract description: string;

  /**
   * @constructor
   * @param {KoniState} state - Koni state
   * @param {string} chain - Pool's chain
   * */
  protected constructor (state: KoniState, chain: string) {
    this.state = state;
    this.chain = chain;
  }

  protected get substrateApi (): _SubstrateApi {
    return this.state.getSubstrateApi(this.chain);
  }

  protected get evmApi (): _EvmApi {
    return this.state.getEvmApi(this.chain);
  }

  public get chainInfo (): _ChainInfo {
    return this.state.getChainInfo(this.chain);
  }

  protected get nativeToken (): _ChainAsset {
    return this.state.getNativeTokenInfo(this.chain);
  }

  protected get defaultInfo (): Pick<YieldPoolInfo, 'name' | 'group' | 'chain' | 'slug'> {
    return {
      name: this.name,
      group: this.group,
      chain: this.chain,
      slug: this.slug
    };
  }

  /** Can mint when haven't enough native token (use input token for fee) */
  public get isPoolSupportAlternativeFee (): boolean {
    return false;
  }

  public async getPoolInfo (): Promise<YieldPoolInfo | undefined> {
    return this.state.dbService.getYieldPool(this.slug);
  }

  public async getPoolPosition (address: string): Promise<YieldPositionInfo | undefined> {
    return this.state.dbService.getYieldPositionByAddressAndSlug(address, this.slug);
  }

  /* Subscribe data */

  /** Subscribe pool info */
  public abstract subscribePoolInfo (callback: (data: YieldPoolInfo) => void): Promise<VoidFunction>;
  /** Subscribe pool position */
  public abstract subscribePoolPosition (useAddresses: string[], callback: (rs: YieldPositionInfo) => void): Promise<VoidFunction>;
  /** Get pool reward */
  public abstract getPoolReward (useAddresses: string[], callback: (rs: EarningRewardItem) => void): Promise<VoidFunction>; // TODO: Change callback
  /** Get pool target */
  public abstract getPoolTargets (): Promise<YieldPoolTarget[]>;

  /* Subscribe data */

  /* Join action */

  /* Generate steps */

  /**
   * @function firstStepFee
   * */
  protected get firstStepFee (): YieldTokenBaseInfo {
    return {
      slug: ''
    };
  }

  /**
   * @function defaultSubmitStep
   * @description Default submit step data
   * */
  protected abstract get defaultSubmitStep (): YieldStepBaseInfo;

  /**
   * @async
   * @function getTokenApproveStep
   * @param {OptimalYieldPathParams} params - base param to join pool
   * @description Generate token approve step data
   * */
  protected async getTokenApproveStep (params: OptimalYieldPathParams): Promise<YieldStepBaseInfo | undefined> {
    return Promise.resolve(undefined);
  }

  /**
   * @async
   * @function getXcmStep
   * @param {OptimalYieldPathParams} params - base param to join pool
   * @description Generate token approve step data
   * */
  protected async getXcmStep (params: OptimalYieldPathParams): Promise<YieldStepBaseInfo | undefined> {
    return Promise.resolve(undefined);
  }

  /**
   * @async
   * @function getSubmitStep
   * @param {OptimalYieldPathParams} params - base param to join pool
   * @description Generate token approve step data
   * */
  protected abstract getSubmitStep (params: OptimalYieldPathParams): Promise<YieldStepBaseInfo>;

  /** Generate the optimal steps to join pool */
  public async generateOptimalPath (params: OptimalYieldPathParams): Promise<OptimalYieldPath> {
    const result: OptimalYieldPath = {
      totalFee: [this.firstStepFee],
      steps: [DEFAULT_YIELD_FIRST_STEP]
    };

    try {
      const stepFunctions: GenStepFunction[] = [
        this.getTokenApproveStep,
        this.getXcmStep,
        this.getSubmitStep
      ];

      for (const stepFunction of stepFunctions) {
        const step = await stepFunction(params);

        if (step) {
          const [info, fee] = step;

          result.steps.push({
            id: result.steps.length,
            ...info
          });

          result.totalFee.push(fee);
        }
      }

      return result;
    } catch (e) {
      const errorMessage = (e as Error).message;

      if (errorMessage.includes('network')) {
        result.connectionError = errorMessage.split(' ')[0];
      }

      /* Submit step */

      const [step, fee] = this.defaultSubmitStep;

      result.steps.push({
        id: result.steps.length,
        ...step
      });

      result.totalFee.push(fee);

      /* Submit step */

      return result;
    }
  }

  /* Generate steps */

  /* Validate */

  /** Validate param to join the pool */
  public abstract validateYieldJoin (data: SubmitYieldJoinData, path: OptimalYieldPath): Promise<TransactionError[]>

  /* Validate */

  /* Submit */

  /** Create `transaction` to join the pool step-by-step */
  public abstract handleYieldJoin (data: SubmitYieldJoinData, path: OptimalYieldPath, currentStep: number): Promise<HandleYieldStepData>;

  /* Submit */

  /* Join action */

  /* Leave action */

  /** Validate param to leave the pool */
  public abstract validateYieldLeave (amount: string, address: string, fastLeave: boolean, selectedTarget?: string): Promise<TransactionError[]>
  /** Create `transaction` to leave the pool normal (default unstake) */
  protected abstract handleYieldUnstake (amount: string, address: string, selectedTarget?: string): Promise<[ExtrinsicType, TransactionData]>;
  /** Create `transaction` to leave the pool fast (swap token) */
  protected abstract handleYieldRedeem (amount: string, address: string, selectedTarget?: string): Promise<[ExtrinsicType, TransactionData]>;
  /** Create `transaction` to leave the pool */
  public async handleYieldLeave (fastLeave: boolean, amount: string, address: string, selectedTarget?: string): Promise<[ExtrinsicType, TransactionData]> {
    if (fastLeave) {
      return this.handleYieldRedeem(amount, address, selectedTarget);
    } else {
      return this.handleYieldUnstake(amount, address, selectedTarget);
    }
  }

  /* Leave action */

  /* Other actions */

  /** Create `transaction` to withdraw unstaked amount */
  public abstract handleYieldWithdraw (address: string, unstakingInfo: UnstakingInfo): Promise<TransactionData>;
  /** Create `transaction` to cancel unstake */
  public abstract handleYieldCancelUnstake (params: StakeCancelWithdrawalParams): Promise<TransactionData>;
  /** Create `transaction` to claim reward */
  public abstract handleYieldClaimReward (address: string, bondReward?: boolean): Promise<TransactionData>;

  /* Other actions */
}
