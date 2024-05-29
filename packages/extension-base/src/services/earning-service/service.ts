// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { BasicTxErrorType, ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { CRON_REFRESH_CHAIN_STAKING_METADATA, CRON_REFRESH_EARNING_REWARD_HISTORY_INTERVAL, CRON_REFRESH_STAKING_REWARD_FAST_INTERVAL } from '@subwallet/extension-base/constants';
import KoniState from '@subwallet/extension-base/koni/background/handlers/State';
import { PersistDataServiceInterface, ServiceStatus, StoppableServiceInterface } from '@subwallet/extension-base/services/base/types';
import { _isChainEnabled, _isChainEvmCompatible } from '@subwallet/extension-base/services/chain-service/utils';
import { _STAKING_CHAIN_GROUP } from '@subwallet/extension-base/services/earning-service/constants';
import BaseLiquidStakingPoolHandler from '@subwallet/extension-base/services/earning-service/handlers/liquid-staking/base';
import { EventService } from '@subwallet/extension-base/services/event-service';
import DatabaseService from '@subwallet/extension-base/services/storage-service/DatabaseService';
import { SWTransaction } from '@subwallet/extension-base/services/transaction-service/types';
import { EarningRewardHistoryItem, EarningRewardItem, EarningRewardJson, HandleYieldStepData, HandleYieldStepParams, OptimalYieldPath, OptimalYieldPathParams, RequestEarlyValidateYield, RequestStakeCancelWithdrawal, RequestStakeClaimReward, RequestYieldLeave, RequestYieldWithdrawal, ResponseEarlyValidateYield, TransactionData, ValidateYieldProcessParams, YieldPoolInfo, YieldPoolTarget, YieldPoolType, YieldPositionInfo } from '@subwallet/extension-base/types';
import { addLazy, categoryAddresses, createPromiseHandler, PromiseHandler, removeLazy } from '@subwallet/extension-base/utils';
import { fetchStaticCache } from '@subwallet/extension-base/utils/fetchStaticCache';
import { BehaviorSubject } from 'rxjs';

import { AcalaLiquidStakingPoolHandler, AmplitudeNativeStakingPoolHandler, AstarNativeStakingPoolHandler, BasePoolHandler, BifrostLiquidStakingPoolHandler, BifrostMantaLiquidStakingPoolHandler, InterlayLendingPoolHandler, NominationPoolHandler, ParallelLiquidStakingPoolHandler, ParaNativeStakingPoolHandler, RelayNativeStakingPoolHandler, StellaSwapLiquidStakingPoolHandler } from './handlers';

const fetchPoolsData = async () => {
  const fetchData = await fetchStaticCache<{data: Record<string, YieldPoolInfo>}>('earning/yield-pools.json', { data: {} });

  return fetchData.data;
};

export default class EarningService implements StoppableServiceInterface, PersistDataServiceInterface {
  protected readonly state: KoniState;
  protected handlers: Record<string, BasePoolHandler> = {};
  private earningRewardSubject: BehaviorSubject<EarningRewardJson> = new BehaviorSubject<EarningRewardJson>({ ready: false, data: {} });
  private earningRewardHistorySubject: BehaviorSubject<Record<string, EarningRewardHistoryItem>> = new BehaviorSubject<Record<string, EarningRewardHistoryItem>>({});
  private minAmountPercentSubject: BehaviorSubject<Record<string, number>> = new BehaviorSubject<Record<string, number>>({});

  // earning
  public readonly yieldPoolInfoSubject = new BehaviorSubject<Record<string, YieldPoolInfo>>({});
  public readonly yieldPositionSubject = new BehaviorSubject<Record<string, YieldPositionInfo>>({});
  public readonly yieldPositionListSubject = new BehaviorSubject<YieldPositionInfo[]>([]); // virtual list of yieldPositionSubject with filter values

  private dbService: DatabaseService;
  private eventService: EventService;
  private useOnlineCacheOnly = true;

  constructor (state: KoniState) {
    this.state = state;
    this.dbService = state.dbService;
    this.eventService = state.eventService;
  }

  public disableOnlineCacheOnly () {
    this.useOnlineCacheOnly = false;
  }

  private async initHandlers () {
    await this.eventService.waitChainReady;
    const chains: string[] = [];

    for (const chain of Object.values(this.state.getChainInfoMap())) {
      if (chain.chainStatus === 'ACTIVE') {
        chains.push(chain.slug);
      }
    }

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
          handlers.push(new BifrostMantaLiquidStakingPoolHandler(this.state, chain));
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

    // Emit earning ready
    this.eventService.emit('earning.ready', true);
  }

  startPromiseHandler: PromiseHandler<void> = createPromiseHandler();
  stopPromiseHandler: PromiseHandler<void> = createPromiseHandler();
  status: ServiceStatus = ServiceStatus.NOT_INITIALIZED;

  async init (): Promise<void> {
    this.status = ServiceStatus.INITIALIZING;

    await this.initHandlers();

    // Load data from db
    await this.loadData();

    // Pin list with value from map
    this.yieldPositionSubject.subscribe({
      next: (data) => {
        const activeMap = this.state.getActiveChainInfoMap();
        const activePositions = Object.values(data).filter((item) => {
          return !!activeMap[item.chain];
        });

        this.yieldPositionListSubject.next(Object.values(activePositions));
      }
    });

    this.status = ServiceStatus.INITIALIZED;

    await this.start();

    this.handleActions();
  }

  private delayReloadTimeout: NodeJS.Timeout | undefined;

  handleActions () {
    this.eventService.onLazy((events, eventTypes) => {
      let delayReload = false;

      (async () => {
        const removedAddresses: string[] = [];
        const removeChains: string[] = [];

        events.forEach((event) => {
          if (event.type === 'account.remove') {
            removedAddresses.push(event.data[0] as string);
          }

          if (event.type === 'chain.updateState') {
            const chainState = this.state.getChainStateByKey(event.data[0] as string);

            if (chainState && !_isChainEnabled(chainState)) {
              removeChains.push(event.data[0] as string);
            }
          }

          if (event.type === 'transaction.done') {
            const transactionData = event.data[0] as SWTransaction;
            const notRequireReloadTypes = [
              ExtrinsicType.TRANSFER_BALANCE,
              ExtrinsicType.TRANSFER_TOKEN,
              ExtrinsicType.TRANSFER_XCM,
              ExtrinsicType.SEND_NFT,
              ExtrinsicType.CROWDLOAN
            ];

            if (notRequireReloadTypes.indexOf(transactionData.extrinsicType) === -1) {
              delayReload = true;
            }
          }
        });

        if (removeChains.length || removedAddresses.length) {
          await this.removeYieldPositions(removeChains, removedAddresses);
        }

        // Account changed or chain changed (active or inactive)
        // Chain changed (active or inactive)
        // Todo: Optimize performance of chain active or inactive in the future
        if (eventTypes.includes('account.updateCurrent') || eventTypes.includes('account.remove') || eventTypes.includes('chain.updateState') || delayReload) {
          if (delayReload) {
            this.delayReloadTimeout = setTimeout(() => {
              this.reloadEarning().catch(console.error); // Timeout is removed inside reloadEarning > runUnsubscribePoolsPosition
            }, 3000);
          } else {
            this.delayReloadTimeout && clearTimeout(this.delayReloadTimeout);
            this.delayReloadTimeout = undefined;
            await this.reloadEarning();
          }
        }
      })().catch(console.error);
    });
  }

  async loadData (): Promise<void> {
    await this.getYieldPoolInfoFromDB();
    await this.getYieldPositionFromDB();
  }

  persistData (): Promise<void> {
    // Data is auto persisted with lazy queue
    return Promise.resolve(undefined);
  }

  async start (): Promise<void> {
    if (this.status === ServiceStatus.STOPPING) {
      await this.waitForStopped();
    }

    if (this.status === ServiceStatus.STARTED || this.status === ServiceStatus.STARTING) {
      return this.waitForStarted();
    }

    this.status = ServiceStatus.STARTING;

    // Start subscribe pools' info
    // await this.runSubscribePoolsInfo();

    // Start subscribe pools' position
    await this.runSubscribePoolsPosition();

    // Start subscribe pools' reward
    this.runSubscribeStakingRewardInterval();

    // Start subscribe pools' reward history
    this.runSubscribeEarningRewardHistoryInterval();

    // Update promise handler
    this.startPromiseHandler.resolve();
    this.stopPromiseHandler = createPromiseHandler();

    this.status = ServiceStatus.STARTED;
  }

  async stop (): Promise<void> {
    if (this.status === ServiceStatus.STARTING) {
      await this.waitForStarted();
    }

    if (this.status === ServiceStatus.STOPPED || this.status === ServiceStatus.STOPPING) {
      return this.waitForStopped();
    }

    this.status = ServiceStatus.STOPPING;

    await this.persistData();

    // Stop subscribe pools' info
    // this.runUnsubscribePoolsInfo();

    // Stop subscribe pools' position
    this.runUnsubscribePoolsPosition();

    // Stop subscribe pools' reward
    this.runUnsubscribeStakingRewardInterval();

    // Stop subscribe pools' reward history
    this.runUnsubscribeEarningRewardHistoryInterval();

    // Update promise handler
    this.stopPromiseHandler.resolve();
    this.startPromiseHandler = createPromiseHandler();

    this.status = ServiceStatus.STOPPED;
  }

  waitForStarted (): Promise<void> {
    return this.startPromiseHandler.promise;
  }

  waitForStopped (): Promise<void> {
    return this.stopPromiseHandler.promise;
  }

  /* Pools' info methods */

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

  public async getYieldPool (slug: string): Promise<YieldPoolInfo | undefined> {
    await this.eventService.waitEarningReady;
    const poolInfoMap = this.yieldPoolInfoSubject.getValue();

    return poolInfoMap[slug];
  }

  public async subscribePoolsInfo (onlineData: Record<string, YieldPoolInfo>, callback: (rs: YieldPoolInfo) => void): Promise<VoidFunction> {
    let cancel = false;

    await this.eventService.waitChainReady;

    const unsubList: Array<VoidFunction> = [];

    for (const handler of Object.values(this.handlers)) {
      // Force subscribe onchain data
      const forceSubscribe = handler.type === YieldPoolType.LIQUID_STAKING || handler.type === YieldPoolType.LENDING || !onlineData[handler.slug];

      if (!this.useOnlineCacheOnly || forceSubscribe) {
        handler.subscribePoolInfo(callback)
          .then((unsub) => {
            if (!cancel) {
              unsubList.push(unsub);
            } else {
              unsub();
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

  private async getYieldPoolInfoFromDB () {
    // Get online pool data
    const yieldPoolInfo = {} as Record<string, YieldPoolInfo>;

    const existedYieldPoolInfo = await this.dbService.getYieldPools();

    existedYieldPoolInfo.forEach((info) => {
      yieldPoolInfo[info.slug] = info;
    });

    this.yieldPoolInfoSubject.next(yieldPoolInfo);
  }

  public subscribeYieldPoolInfo () {
    return this.yieldPoolInfoSubject;
  }

  public async getYieldPoolInfo () {
    await this.eventService.waitEarningReady;

    return Object.values(this.yieldPoolInfoSubject.getValue());
  }

  private yieldPoolPersistQueue: YieldPoolInfo[] = [];

  public updateYieldPoolInfo (data: YieldPoolInfo) {
    this.yieldPoolPersistQueue.push(data);

    addLazy('persistYieldPoolInfo', () => {
      const yieldPoolInfo = this.yieldPoolInfoSubject.getValue();

      const queue = [...this.yieldPoolPersistQueue];

      this.yieldPoolPersistQueue = [];

      // Update yield pool info
      queue.forEach((item) => {
        const existed = yieldPoolInfo[item.slug];

        if (item.statistic && (!existed?.lastUpdated || existed.lastUpdated < (item?.lastUpdated || 0))) { // Only update item has statistic information
          yieldPoolInfo[item.slug] = item;
        }
      });
      this.yieldPoolInfoSubject.next(yieldPoolInfo);

      // Persist data
      this.dbService.updateYieldPoolsStore(queue).catch(console.warn);
    }, 300, 900);
  }

  private async fetchingPoolsInfoOnline () {
    const onlineData = await fetchPoolsData();

    Object.values(onlineData).forEach((item) => {
      this.updateYieldPoolInfo(item);
    });

    return onlineData;
  }

  private yieldPoolsInfoUnsub: VoidFunction | undefined;

  async runSubscribePoolsInfo () {
    await this.eventService.waitChainReady;
    this.runUnsubscribePoolsInfo();

    // Fetching online data
    const onlineData = await this.fetchingPoolsInfoOnline();

    const interval = setInterval(() => {
      this.fetchingPoolsInfoOnline().catch(console.error);
    }, CRON_REFRESH_CHAIN_STAKING_METADATA);

    // Fetching from chains
    this.subscribePoolsInfo(onlineData, (data) => {
      data.lastUpdated = Date.now();
      this.updateYieldPoolInfo(data);
    }).then((rs) => {
      this.yieldPoolsInfoUnsub = () => {
        rs();
        clearInterval(interval);
      };
    }).catch(console.error);
  }

  runUnsubscribePoolsInfo () {
    this.yieldPoolsInfoUnsub?.();
  }

  /* Pools' info methods */

  /* Pools' position methods */

  public async getYieldPosition (address: string, slug: string): Promise<YieldPositionInfo | undefined> {
    await this.eventService.waitEarningReady;

    return this.yieldPositionSubject.getValue()[`${slug}---${address}`];
  }

  public async subscribePoolPositions (addresses: string[], callback: (rs: YieldPositionInfo) => void): Promise<VoidFunction> {
    let cancel = false;

    await this.eventService.waitChainReady;

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

  async removeYieldPositions (chains?: string[], addresses?: string[]) {
    const removeKeys: string[] = [];

    chains && chains.length > 0 && Object.entries(this.yieldPositionSubject.getValue()).forEach(([key, value]) => {
      if (chains.indexOf(value.chain) > -1 && !removeKeys.includes(key)) {
        removeKeys.push(key);
      }
    });

    addresses && addresses.length > 0 && Object.entries(this.yieldPositionSubject.getValue()).forEach(([key, value]) => {
      if (addresses.indexOf(value.address) > -1 && !removeKeys.includes(key)) {
        removeKeys.push(key);
      }
    });

    // Remove by keys
    const yieldPositionInfo = this.yieldPositionSubject.getValue();

    for (const key of removeKeys) {
      delete yieldPositionInfo[key];
    }

    this.yieldPositionSubject.next(yieldPositionInfo);
    addresses && addresses.length > 0 && await this.dbService.removeYieldPositionByAddresses(addresses);
    chains && chains.length > 0 && await this.dbService.removeYieldPositionByChains(chains);
  }

  private async getYieldPositionFromDB () {
    await this.eventService.waitChainReady;
    await this.eventService.waitKeyringReady;

    const addresses = this.state.getDecodedAddresses();

    const existedYieldPosition = await this.dbService.getYieldNominationPoolPosition(addresses, this.state.activeChainSlugs);

    const yieldPositionInfo = this.yieldPositionSubject.getValue();

    existedYieldPosition.forEach((item) => {
      yieldPositionInfo[this._getYieldPositionKey(item.slug, item.address)] = item;
    });

    this.yieldPositionSubject.next(yieldPositionInfo);
  }

  public subscribeYieldPosition () {
    return this.yieldPositionListSubject;
  }

  public async getYieldPositionInfo () {
    await this.eventService.waitEarningReady;

    return Promise.resolve(this.yieldPositionListSubject.getValue());
  }

  yieldPositionPersistQueue: YieldPositionInfo[] = [];

  public async resetYieldPosition () {
    this.yieldPositionSubject.next({});
    this.yieldPositionPersistQueue = [];
    removeLazy('persistYieldPositionInfo');
    await this.dbService.stores.yieldPosition.clear();
  }

  private _getYieldPositionKey (slug: string, address: string): string {
    return `${slug}---${address}`;
  }

  public updateYieldPosition (data: YieldPositionInfo) {
    this.yieldPositionPersistQueue.push(data);

    addLazy('persistYieldPositionInfo', () => {
      const yieldPositionInfo = this.yieldPositionSubject.getValue();
      const queue = [...this.yieldPositionPersistQueue];

      this.yieldPositionPersistQueue = [];

      // Update yield position info
      queue.forEach((item) => {
        yieldPositionInfo[this._getYieldPositionKey(item.slug, item.address)] = item;
      });
      this.yieldPositionSubject.next(yieldPositionInfo);

      // Persist data
      this.dbService.updateYieldPositions(queue).catch(console.warn);
    }, 300, 900);
  }

  async reloadEarning (reset = false): Promise<void> {
    await this.waitForStarted();
    this.runUnsubscribePoolsPosition();
    this.runUnsubscribeStakingRewardInterval();
    this.runUnsubscribeEarningRewardHistoryInterval();

    reset && await this.resetYieldPosition();

    await this.runSubscribePoolsPosition();
    this.runSubscribeStakingRewardInterval();
    this.runSubscribeEarningRewardHistoryInterval();
  }

  private yieldPositionUnsub: VoidFunction | undefined;

  async runSubscribePoolsPosition () {
    await this.eventService.waitKeyringReady;
    this.runUnsubscribePoolsPosition();

    const addresses = this.state.getDecodedAddresses();

    this.subscribePoolPositions(addresses, (data) => {
      this.updateYieldPosition(data);
    }).then((rs) => {
      this.yieldPositionUnsub = rs;
    }).catch(console.error);
  }

  runUnsubscribePoolsPosition () {
    this.yieldPositionUnsub?.();
    removeLazy('persistYieldPositionInfo');
    this.yieldPositionPersistQueue = [];

    // Remove delay reload
    this.delayReloadTimeout && clearTimeout(this.delayReloadTimeout);
    this.delayReloadTimeout = undefined;
  }

  /* Pools' position methods */

  /* Get pools' reward */

  earningsRewardQueue: EarningRewardItem[] = [];

  public updateEarningReward (stakingRewardData: EarningRewardItem): void {
    this.earningsRewardQueue.push(stakingRewardData);

    addLazy('updateEarningReward', () => {
      const stakingRewardState = this.earningRewardSubject.getValue();

      this.earningsRewardQueue.forEach((item) => {
        const key = `${item.slug}---${item.address}`;

        stakingRewardState.data[key] = item;
      });
      stakingRewardState.ready = true;

      this.earningRewardSubject.next(stakingRewardState);

      this.earningsRewardQueue = [];
    });
  }

  public async getPoolReward (addresses: string[], callback: (result: EarningRewardItem) => void): Promise<VoidFunction> {
    let cancel = false;

    await this.eventService.waitChainReady;

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

  earningsRewardInterval: NodeJS.Timer | undefined;

  runSubscribeStakingRewardInterval () {
    const addresses = this.state.getDecodedAddresses();

    if (!addresses.length) {
      return;
    }

    this.getPoolReward(addresses, (result: EarningRewardItem) => {
      this.updateEarningReward(result);
    }).catch(console.error);

    this.earningsRewardInterval = setInterval(() => {
      this.getPoolReward(addresses, (result: EarningRewardItem) => {
        this.updateEarningReward(result);
      }).catch(console.error);
    }, CRON_REFRESH_STAKING_REWARD_FAST_INTERVAL);
  }

  runUnsubscribeStakingRewardInterval () {
    removeLazy('updateEarningReward');
    this.earningsRewardQueue = [];
    this.earningsRewardInterval && clearInterval(this.earningsRewardInterval);
  }

  public async fetchPoolRewardHistory (addresses: string[], callback: (result: EarningRewardHistoryItem) => void): Promise<VoidFunction> {
    let cancel = false;

    await this.eventService.waitChainReady;

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

  private earningRewardHistoryQueue: EarningRewardHistoryItem[] = [];

  public updateEarningRewardHistory (earningRewardHistory: EarningRewardHistoryItem): void {
    this.earningRewardHistoryQueue.push(earningRewardHistory);

    addLazy('updateEarningRewardHistory', () => {
      const earningRewardHistoryState = this.earningRewardHistorySubject.getValue();

      this.earningRewardHistoryQueue.forEach((item) => {
        const key = `${item.slug}---${item.address}---${item.eventIndex}`;

        earningRewardHistoryState[key] = item;
      });

      this.earningRewardHistorySubject.next(earningRewardHistoryState);
      this.earningRewardHistoryQueue = [];
    }, 300, 1800);
  }

  public subscribeEarningRewardHistory (): BehaviorSubject<Record<string, EarningRewardHistoryItem>> {
    return this.earningRewardHistorySubject;
  }

  public getEarningRewardHistory (): Record<string, EarningRewardHistoryItem> {
    return this.earningRewardHistorySubject.getValue();
  }

  earningsRewardHistoryInterval: NodeJS.Timer | undefined;

  runSubscribeEarningRewardHistoryInterval () {
    this.runUnsubscribeEarningRewardHistoryInterval();
    const addresses = this.state.getDecodedAddresses();

    if (!addresses.length) {
      return;
    }

    this.fetchPoolRewardHistory(addresses, (result: EarningRewardHistoryItem) => {
      this.updateEarningRewardHistory(result);
    }).catch(console.error);

    this.earningsRewardHistoryInterval = setInterval(() => {
      this.fetchPoolRewardHistory(addresses, (result: EarningRewardHistoryItem) => {
        this.updateEarningRewardHistory(result);
      }).catch(console.error);
    }, CRON_REFRESH_EARNING_REWARD_HISTORY_INTERVAL);
  }

  runUnsubscribeEarningRewardHistoryInterval () {
    removeLazy('updateEarningRewardHistory');
    this.earningRewardHistoryQueue = [];
    this.earningsRewardHistoryInterval && clearInterval(this.earningsRewardHistoryInterval);
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
    let targets: YieldPoolTarget[] = [];

    if (this.useOnlineCacheOnly) {
      targets = await fetchStaticCache(`earning/targets/${slug}.json`, []);
    }

    const handler = this.getPoolHandler(slug);

    if (!targets.length && handler) {
      await this.eventService.waitChainReady;
      targets = await handler.getPoolTargets();
    }

    return targets;
  }

  /* Get pool's targets */

  /* Handle actions */

  /* Join */

  public async earlyValidateJoin (request: RequestEarlyValidateYield): Promise<ResponseEarlyValidateYield> {
    await this.eventService.waitChainReady;

    const { slug } = request;
    const handler = this.getPoolHandler(slug);

    if (handler) {
      return handler.earlyValidate(request);
    } else {
      throw new TransactionError(BasicTxErrorType.INTERNAL_ERROR);
    }
  }

  public async generateOptimalSteps (params: OptimalYieldPathParams): Promise<OptimalYieldPath> {
    await this.eventService.waitChainReady;

    const { slug } = params;
    const handler = this.getPoolHandler(slug);

    if (handler) {
      return handler.generateOptimalPath(params);
    } else {
      throw new TransactionError(BasicTxErrorType.INTERNAL_ERROR);
    }
  }

  public async validateYieldJoin (params: ValidateYieldProcessParams): Promise<TransactionError[]> {
    await this.eventService.waitChainReady;

    const { slug } = params.data;
    const handler = this.getPoolHandler(slug);

    if (handler) {
      return handler.validateYieldJoin(params.data, params.path);
    } else {
      return [new TransactionError(BasicTxErrorType.INTERNAL_ERROR)];
    }
  }

  public async handleYieldJoin (params: HandleYieldStepParams): Promise<HandleYieldStepData> {
    await this.eventService.waitChainReady;

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
    await this.eventService.waitChainReady;

    const { slug } = params;
    const handler = this.getPoolHandler(slug);

    if (handler) {
      return handler.validateYieldLeave(params.amount, params.address, params.fastLeave, params.selectedTarget);
    } else {
      return Promise.reject(new TransactionError(BasicTxErrorType.INTERNAL_ERROR));
    }
  }

  public async handleYieldLeave (params: RequestYieldLeave): Promise<[ExtrinsicType, TransactionData]> {
    await this.eventService.waitChainReady;

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
    await this.eventService.waitChainReady;

    const { slug } = params;
    const handler = this.getPoolHandler(slug);

    if (handler) {
      return handler.handleYieldWithdraw(params.address, params.unstakingInfo);
    } else {
      return Promise.reject(new TransactionError(BasicTxErrorType.INTERNAL_ERROR));
    }
  }

  public async handleYieldCancelUnstake (params: RequestStakeCancelWithdrawal): Promise<TransactionData> {
    await this.eventService.waitChainReady;

    const { slug } = params;
    const handler = this.getPoolHandler(slug);

    if (handler) {
      return handler.handleYieldCancelUnstake(params);
    } else {
      return Promise.reject(new TransactionError(BasicTxErrorType.INTERNAL_ERROR));
    }
  }

  public async handleYieldClaimReward (params: RequestStakeClaimReward): Promise<TransactionData> {
    await this.eventService.waitChainReady;

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

  // Clear wallet data
  public async resetWallet () {
    await this.resetYieldPosition();
  }
}
