// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { BasicTxErrorType, ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import KoniState from '@subwallet/extension-base/koni/background/handlers/State';
import { _isChainEvmCompatible } from '@subwallet/extension-base/services/chain-service/utils';
import { _STAKING_CHAIN_GROUP } from '@subwallet/extension-base/services/earning-service/constants';
import BaseLiquidStakingPoolHandler from '@subwallet/extension-base/services/earning-service/handlers/liquid-staking/base';
import { EarningRewardHistoryItem, EarningRewardItem, EarningRewardJson, HandleYieldStepData, HandleYieldStepParams, OptimalYieldPath, OptimalYieldPathParams, RequestEarlyValidateYield, RequestStakeCancelWithdrawal, RequestStakeClaimReward, RequestYieldLeave, RequestYieldWithdrawal, ResponseEarlyValidateYield, TransactionData, ValidateYieldProcessParams, YieldPoolInfo, YieldPoolTarget, YieldPoolType, YieldPositionInfo } from '@subwallet/extension-base/types';
import { categoryAddresses } from '@subwallet/extension-base/utils';
import { BehaviorSubject } from 'rxjs';

import { AcalaLiquidStakingPoolHandler, AmplitudeNativeStakingPoolHandler, AstarNativeStakingPoolHandler, BasePoolHandler, BifrostLiquidStakingPoolHandler, InterlayLendingPoolHandler, NominationPoolHandler, ParallelLiquidStakingPoolHandler, ParaNativeStakingPoolHandler, RelayNativeStakingPoolHandler, StellaSwapLiquidStakingPoolHandler } from './handlers';

export default class EarningService {
  protected readonly state: KoniState;
  protected handlers: Record<string, BasePoolHandler> = {};
  private earningRewardSubject: BehaviorSubject<EarningRewardJson> = new BehaviorSubject<EarningRewardJson>({ ready: false, data: {} });
  private earningRewardHistorySubject: BehaviorSubject<Record<string, EarningRewardHistoryItem>> = new BehaviorSubject<Record<string, EarningRewardHistoryItem>>({});
  private minAmountPercentSubject: BehaviorSubject<Record<string, number>> = new BehaviorSubject<Record<string, number>>({});

  constructor (state: KoniState) {
    this.state = state;

    this.initHandlers().catch(console.error);
  }

  private async initHandlers () {
    await this.state.eventService.waitChainReady;
    const chains = Object.keys(this.state.getChainInfoMap());
    const minAmountPercent: Record<string, number> = {};

    for (const chain of chains) {
      const handlers: BasePoolHandler[] = [];

      if (_STAKING_CHAIN_GROUP.relay.includes(chain)) {
        handlers.push(new RelayNativeStakingPoolHandler(this.state, chain));
      }

      if (_STAKING_CHAIN_GROUP.para.includes(chain)) {
        handlers.push(new ParaNativeStakingPoolHandler(this.state, chain));
      }

      if (_STAKING_CHAIN_GROUP.astar.includes(chain)) {
        handlers.push(new AstarNativeStakingPoolHandler(this.state, chain));
      }

      if (_STAKING_CHAIN_GROUP.amplitude.includes(chain)) {
        handlers.push(new AmplitudeNativeStakingPoolHandler(this.state, chain));
      }

      if (_STAKING_CHAIN_GROUP.nominationPool.includes(chain)) {
        handlers.push(new NominationPoolHandler(this.state, chain));
      }

      if (_STAKING_CHAIN_GROUP.liquidStaking.includes(chain)) {
        if (chain === 'bifrost_dot') {
          handlers.push(new BifrostLiquidStakingPoolHandler(this.state, chain));
        }

        if (chain === 'acala') {
          handlers.push(new AcalaLiquidStakingPoolHandler(this.state, chain));
        }

        if (chain === 'parallel') {
          handlers.push(new ParallelLiquidStakingPoolHandler(this.state, chain));
        }

        if (chain === 'moonbeam') {
          handlers.push(new StellaSwapLiquidStakingPoolHandler(this.state, chain));
        }
      }

      if (_STAKING_CHAIN_GROUP.lending.includes(chain)) {
        if (chain === 'interlay') {
          handlers.push(new InterlayLendingPoolHandler(this.state, chain));
        }
      }

      for (const handler of handlers) {
        this.handlers[handler.slug] = handler;
      }
    }

    for (const handler of Object.values(this.handlers)) {
      if (handler.type === YieldPoolType.LIQUID_STAKING) {
        minAmountPercent[handler.slug] = (handler as BaseLiquidStakingPoolHandler).minAmountPercent;
      }
    }

    minAmountPercent.default = BaseLiquidStakingPoolHandler.defaultMinAmountPercent;

    this.minAmountPercentSubject.next(minAmountPercent);
  }

  public getPoolHandler (slug: string): BasePoolHandler | undefined {
    return this.handlers[slug];
  }

  public isPoolSupportAlternativeFee (slug: string): boolean {
    const handler = this.getPoolHandler(slug);

    if (handler) {
      return handler.isPoolSupportAlternativeFee;
    } else {
      throw new TransactionError(BasicTxErrorType.INTERNAL_ERROR);
    }
  }

  public subscribeMinAmountPercent (): BehaviorSubject<Record<string, number>> {
    return this.minAmountPercentSubject;
  }

  public getMinAmountPercent (): Record<string, number> {
    return this.minAmountPercentSubject.getValue();
  }

  /* Subscribe pools' info */

  public async subscribePoolsInfo (callback: (rs: YieldPoolInfo) => void): Promise<VoidFunction> {
    let cancel = false;

    await this.state.eventService.waitChainReady;

    const unsubList: Array<VoidFunction> = [];

    for (const handler of Object.values(this.handlers)) {
      handler.subscribePoolInfo(callback)
        .then((unsub) => {
          if (cancel) {
            unsub();
          } else {
            unsubList.push(unsub);
          }
        })
        .catch(console.error);
    }

    return () => {
      cancel = true;
      unsubList.forEach((unsub) => {
        unsub?.();
      });
    };
  }

  /* Subscribe pools' info */

  /* Subscribe pools' position */

  public async subscribePoolPositions (addresses: string[], callback: (rs: YieldPositionInfo) => void): Promise<VoidFunction> {
    let cancel = false;

    await this.state.eventService.waitChainReady;

    const [substrateAddresses, evmAddresses] = categoryAddresses(addresses);
    const activeChains = this.state.activeChainSlugs;
    const unsubList: Array<VoidFunction> = [];

    for (const handler of Object.values(this.handlers)) {
      if (activeChains.includes(handler.chain)) {
        const chainInfo = handler.chainInfo;
        const useAddresses = _isChainEvmCompatible(chainInfo) ? evmAddresses : substrateAddresses;

        handler.subscribePoolPosition(useAddresses, callback)
          .then((unsub) => {
            if (cancel) {
              unsub();
            } else {
              unsubList.push(unsub);
            }
          })
          .catch(console.error);
      }
    }

    return () => {
      cancel = true;
      unsubList.forEach((unsub) => {
        unsub?.();
      });
    };
  }

  /* Subscribe pools' position */

  /* Get pools' reward */

  public updateEarningReward (stakingRewardData: EarningRewardItem): void {
    const stakingRewardState = this.earningRewardSubject.getValue();

    stakingRewardState.ready = true;
    const key = `${stakingRewardData.slug}---${stakingRewardData.address}`;

    stakingRewardState.data[key] = stakingRewardData;

    this.earningRewardSubject.next(stakingRewardState);
  }

  public async getPoolReward (addresses: string[], callback: (result: EarningRewardItem) => void): Promise<VoidFunction> {
    let cancel = false;

    await this.state.eventService.waitChainReady;

    const [substrateAddresses, evmAddresses] = categoryAddresses(addresses);
    const activeChains = this.state.activeChainSlugs;
    const unsubList: Array<VoidFunction> = [];

    for (const handler of Object.values(this.handlers)) {
      if (activeChains.includes(handler.chain)) {
        const chainInfo = handler.chainInfo;
        const useAddresses = _isChainEvmCompatible(chainInfo) ? evmAddresses : substrateAddresses;

        handler.getPoolReward(useAddresses, callback)
          .then((unsub) => {
            if (cancel) {
              unsub();
            } else {
              unsubList.push(unsub);
            }
          })
          .catch(console.error);
      }
    }

    return () => {
      cancel = true;
      unsubList.forEach((unsub) => {
        unsub?.();
      });
    };
  }

  public subscribeEarningReward (): BehaviorSubject<EarningRewardJson> {
    return this.earningRewardSubject;
  }

  public getEarningRewards (): EarningRewardJson {
    return this.earningRewardSubject.getValue();
  }

  public async fetchPoolRewardHistory (addresses: string[], callback: (result: EarningRewardHistoryItem) => void): Promise<VoidFunction> {
    let cancel = false;

    await this.state.eventService.waitChainReady;

    const [substrateAddresses, evmAddresses] = categoryAddresses(addresses);
    const activeChains = this.state.activeChainSlugs;
    const unsubList: Array<VoidFunction> = [];

    for (const handler of Object.values(this.handlers)) {
      if (activeChains.includes(handler.chain)) {
        const chainInfo = handler.chainInfo;
        const useAddresses = _isChainEvmCompatible(chainInfo) ? evmAddresses : substrateAddresses;

        handler.getPoolRewardHistory(useAddresses, callback)
          .then((unsub) => {
            if (cancel) {
              unsub();
            } else {
              unsubList.push(unsub);
            }
          })
          .catch(console.error);
      }
    }

    return () => {
      cancel = true;
      unsubList.forEach((unsub) => {
        unsub?.();
      });
    };
  }

  public updateEarningRewardHistory (earningRewardHistory: EarningRewardHistoryItem): void {
    const earningRewardHistoryState = this.earningRewardHistorySubject.getValue();

    const key = `${earningRewardHistory.slug}---${earningRewardHistory.address}---${earningRewardHistory.blockTimestamp}`;

    earningRewardHistoryState[key] = earningRewardHistory;

    this.earningRewardHistorySubject.next(earningRewardHistoryState);
  }

  public subscribeEarningRewardHistory (): BehaviorSubject<Record<string, EarningRewardHistoryItem>> {
    return this.earningRewardHistorySubject;
  }

  public getEarningRewardHistory (): Record<string, EarningRewardHistoryItem> {
    return this.earningRewardHistorySubject.getValue();
  }

  /* Get pools' reward */

  /* Get pool's targets */

  /**
   * @async
   * @function getPoolTargets
   * @param {string} slug - Pool's slug
   * @return {Promise<YieldPoolTarget[]>} List of pool's target
   * */
  public async getPoolTargets (slug: string): Promise<YieldPoolTarget[]> {
    await this.state.eventService.waitChainReady;

    const handler = this.getPoolHandler(slug);

    if (handler) {
      return await handler.getPoolTargets();
    } else {
      return [];
    }
  }

  /* Get pool's targets */

  /* Handle actions */

  /* Join */

  public async earlyValidateJoin (request: RequestEarlyValidateYield): Promise<ResponseEarlyValidateYield> {
    await this.state.eventService.waitChainReady;

    const { slug } = request;
    const handler = this.getPoolHandler(slug);

    if (handler) {
      return handler.earlyValidate(request);
    } else {
      throw new TransactionError(BasicTxErrorType.INTERNAL_ERROR);
    }
  }

  public async generateOptimalSteps (params: OptimalYieldPathParams): Promise<OptimalYieldPath> {
    await this.state.eventService.waitChainReady;

    const { slug } = params;
    const handler = this.getPoolHandler(slug);

    if (handler) {
      return handler.generateOptimalPath(params);
    } else {
      throw new TransactionError(BasicTxErrorType.INTERNAL_ERROR);
    }
  }

  public async validateYieldJoin (params: ValidateYieldProcessParams): Promise<TransactionError[]> {
    await this.state.eventService.waitChainReady;

    const { slug } = params.data;
    const handler = this.getPoolHandler(slug);

    if (handler) {
      return handler.validateYieldJoin(params.data, params.path);
    } else {
      return [new TransactionError(BasicTxErrorType.INTERNAL_ERROR)];
    }
  }

  public async handleYieldJoin (params: HandleYieldStepParams): Promise<HandleYieldStepData> {
    await this.state.eventService.waitChainReady;

    const { slug } = params.data;
    const handler = this.getPoolHandler(slug);

    if (handler) {
      return handler.handleYieldJoin(params.data, params.path, params.currentStep);
    } else {
      return Promise.reject(new TransactionError(BasicTxErrorType.INTERNAL_ERROR));
    }
  }

  /* Join */

  /* Leave */

  public async validateYieldLeave (params: RequestYieldLeave): Promise<TransactionError[]> {
    await this.state.eventService.waitChainReady;

    const { slug } = params;
    const handler = this.getPoolHandler(slug);

    if (handler) {
      return handler.validateYieldLeave(params.amount, params.address, params.fastLeave, params.selectedTarget);
    } else {
      return Promise.reject(new TransactionError(BasicTxErrorType.INTERNAL_ERROR));
    }
  }

  public async handleYieldLeave (params: RequestYieldLeave): Promise<[ExtrinsicType, TransactionData]> {
    await this.state.eventService.waitChainReady;

    const { slug } = params;
    const handler = this.getPoolHandler(slug);

    if (handler) {
      return handler.handleYieldLeave(params.fastLeave, params.amount, params.address, params.selectedTarget);
    } else {
      return Promise.reject(new TransactionError(BasicTxErrorType.INTERNAL_ERROR));
    }
  }

  /* Leave */

  /* Other */

  public async handleYieldWithdraw (params: RequestYieldWithdrawal): Promise<TransactionData> {
    await this.state.eventService.waitChainReady;

    const { slug } = params;
    const handler = this.getPoolHandler(slug);

    if (handler) {
      return handler.handleYieldWithdraw(params.address, params.unstakingInfo);
    } else {
      return Promise.reject(new TransactionError(BasicTxErrorType.INTERNAL_ERROR));
    }
  }

  public async handleYieldCancelUnstake (params: RequestStakeCancelWithdrawal): Promise<TransactionData> {
    await this.state.eventService.waitChainReady;

    const { slug } = params;
    const handler = this.getPoolHandler(slug);

    if (handler) {
      return handler.handleYieldCancelUnstake(params);
    } else {
      return Promise.reject(new TransactionError(BasicTxErrorType.INTERNAL_ERROR));
    }
  }

  public async handleYieldClaimReward (params: RequestStakeClaimReward): Promise<TransactionData> {
    await this.state.eventService.waitChainReady;

    const { slug } = params;
    const handler = this.getPoolHandler(slug);

    if (handler) {
      return handler.handleYieldClaimReward(params.address, params.bondReward);
    } else {
      return Promise.reject(new TransactionError(BasicTxErrorType.INTERNAL_ERROR));
    }
  }

  /* Other */

  /* Handle actions */
}
