// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { ExtrinsicType, StakeCancelWithdrawalParams } from '@subwallet/extension-base/background/KoniTypes';
import KoniState from '@subwallet/extension-base/koni/background/handlers/State';
import { _EvmApi, _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { EarningRewardItem, HandleYieldStepData, OptimalYieldPath, OptimalYieldPathParams, SubmitYieldJoinData, TransactionData, YieldPoolGroup, YieldPoolInfo, YieldPoolTarget, YieldPositionInfo } from '@subwallet/extension-base/types';

/**
 * @class BasePoolHandler
 * @description Base pool handler
 * */
export default abstract class BasePoolHandler {
  /** Koni state */
  protected readonly state: KoniState;

  /** Pool's chain */
  public readonly chain: string;

  /** Pool's chain */
  public abstract slug: string;

  /** Pool's chain */
  protected abstract name: string;

  /** Pool's chain */
  protected abstract description: string;

  /** Pool's chain */
  protected abstract group: YieldPoolGroup;

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
  abstract subscribePoolInfo (callback: (data: YieldPoolInfo) => void): Promise<VoidFunction>;
  /** Subscribe pool position */
  abstract subscribePoolPosition (useAddresses: string[], callback: (rs: YieldPositionInfo) => void): Promise<VoidFunction>;
  /** Get pool reward */
  abstract getPoolReward (useAddresses: string[], callback: (rs: EarningRewardItem) => void): Promise<VoidFunction>; // TODO: Change callback
  /** Get pool target */
  abstract getPoolTargets (): Promise<YieldPoolTarget[]>;

  /* Subscribe data */

  /* Join action */

  /** Generate the optimal steps to join pool */
  abstract generateOptimalPath (params: OptimalYieldPathParams): Promise<OptimalYieldPath>;
  /** Validate param to join the pool */
  abstract validateYieldJoin (data: SubmitYieldJoinData, path: OptimalYieldPath): Promise<TransactionError[]>
  /** Create `transaction` to join the pool step-by-step */
  abstract handleYieldJoin (data: SubmitYieldJoinData, path: OptimalYieldPath, currentStep: number): Promise<HandleYieldStepData>;
  /* Join action */

  /* Join action */

  /** Validate param to leave the pool */
  abstract validateYieldLeave (amount: string, address: string, selectedTarget?: string): Promise<TransactionError[]>
  /** Create `transaction` to leave the pool */
  abstract handleYieldLeave (amount: string, address: string, selectedTarget?: string): Promise<[ExtrinsicType, TransactionData]>;

  /* Join action */

  /* Other actions */

  /** Create `transaction` to withdraw unstaked amount */
  abstract handleYieldWithdraw (address: string, selectedTarget?: string): Promise<TransactionData>;
  /** Create `transaction` to cancel unstake */
  abstract handleYieldCancelUnstake (params: StakeCancelWithdrawalParams): Promise<TransactionData>;
  /** Create `transaction` to claim reward */
  abstract handleYieldClaimReward (address: string, bondReward?: boolean): Promise<TransactionData>;

  /* Other actions */
}
