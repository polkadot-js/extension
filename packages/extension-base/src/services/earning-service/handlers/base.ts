// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { ChainStakingMetadata, NominatorMetadata, OptimalYieldPath, RequestYieldStepSubmit, StakeCancelWithdrawalParams, StakeClaimRewardParams, StakeWithdrawalParams, UnbondingSubmitParams, ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import KoniState from '@subwallet/extension-base/koni/background/handlers/State';
import { _EvmApi, _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { EarningRewardItem, HandleYieldStepData, OptimalYieldPathParams, SubmitJoinNativeStaking, SubmitJoinNominationPool, SubmitYieldStepData, YieldPoolTarget, YieldPoolGroup, YieldPoolInfo, YieldPositionInfo } from '@subwallet/extension-base/types';
import { TransactionConfig } from 'web3-core';

import { SubmittableExtrinsic } from '@polkadot/api/types';

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
  abstract validateYieldJoin (address: string, params: OptimalYieldPathParams, path: OptimalYieldPath, data?: SubmitYieldStepData | SubmitJoinNativeStaking | SubmitJoinNominationPool): Promise<TransactionError[]>
  /** Create `transaction` to join the pool step-by-step */
  abstract handleYieldJoin (address: string, params: OptimalYieldPathParams, requestData: RequestYieldStepSubmit, path: OptimalYieldPath, currentStep: number): Promise<HandleYieldStepData>;
  /* Join action */

  /* Join action */

  /** Validate param to leave the pool */
  abstract validateYieldLeave (amount: string, address: string, selectedValidators: ValidatorInfo[], chainStakingMetadata: ChainStakingMetadata, nominatorMetadata?: NominatorMetadata): Promise<TransactionError[]>
  /** Create `transaction` to leave the pool */
  abstract handleYieldLeave (params: UnbondingSubmitParams): Promise<SubmittableExtrinsic<'promise'> | TransactionConfig>;

  /* Join action */

  /* Other actions */

  /** Create `transaction` to withdraw unstaked amount */
  abstract handleYieldWithdraw (params: StakeWithdrawalParams): Promise<SubmittableExtrinsic<'promise'> | TransactionConfig>;
  /** Create `transaction` to cancel unstake */
  abstract handleYieldCancelUnstake (params: StakeCancelWithdrawalParams): Promise<SubmittableExtrinsic<'promise'> | TransactionConfig>;
  /** Create `transaction` to claim reward */
  abstract handleYieldClaimReward (params: StakeClaimRewardParams): Promise<SubmittableExtrinsic<'promise'> | TransactionConfig>;

  /* Other actions */
}
