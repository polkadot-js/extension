// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BalanceError } from '@subwallet/extension-base/background/errors/BalanceError';
import { AmountData, BalanceErrorType } from '@subwallet/extension-base/background/KoniTypes';
import { ALL_ACCOUNT_KEY } from '@subwallet/extension-base/constants';
import KoniState from '@subwallet/extension-base/koni/background/handlers/State';
import { BalanceMapImpl } from '@subwallet/extension-base/services/balance-service/BalanceMapImpl';
import { groupBalance } from '@subwallet/extension-base/services/balance-service/helpers/group';
import { subscribeEVMBalance } from '@subwallet/extension-base/services/balance-service/helpers/subscribe/evm';
import { subscribeSubstrateBalance } from '@subwallet/extension-base/services/balance-service/helpers/subscribe/substrate';
import { ServiceStatus, StoppableServiceInterface } from '@subwallet/extension-base/services/base/types';
import { ChainService } from '@subwallet/extension-base/services/chain-service';
import { _PURE_EVM_CHAINS } from '@subwallet/extension-base/services/chain-service/constants';
import { _getChainNativeTokenSlug, _isChainEvmCompatible, _isPureEvmChain } from '@subwallet/extension-base/services/chain-service/utils';
import { EventService } from '@subwallet/extension-base/services/event-service';
import { EventItem, EventType } from '@subwallet/extension-base/services/event-service/types';
import { KeyringService } from '@subwallet/extension-base/services/keyring-service';
import DatabaseService from '@subwallet/extension-base/services/storage-service/DatabaseService';
import { BalanceItem, BalanceJson } from '@subwallet/extension-base/types';
import { addLazy, categoryAddresses, createPromiseHandler, isAccountAll, PromiseHandler, waitTimeout } from '@subwallet/extension-base/utils';
import { t } from 'i18next';

/**
 * Balance service
 * @class
*/
export class BalanceService implements StoppableServiceInterface {
  private state: KoniState;
  private eventService: EventService;
  private keyringService: KeyringService;
  private dbService: DatabaseService;
  private balanceMap: BalanceMapImpl;
  private chainService: ChainService;

  startPromiseHandler: PromiseHandler<void> = createPromiseHandler();
  stopPromiseHandler: PromiseHandler<void> = createPromiseHandler();
  status: ServiceStatus = ServiceStatus.NOT_INITIALIZED;

  /**
   * @constructor
   * @param {KoniState} state - The state of extension.
   */
  constructor (state: KoniState) {
    this.state = state;
    this.eventService = state.eventService;
    this.keyringService = state.keyringService;
    this.dbService = state.dbService;
    this.chainService = state.chainService;
    this.balanceMap = new BalanceMapImpl();
  }

  async init (): Promise<void> {
    this.status = ServiceStatus.INITIALIZING;

    // Load data from db to balanceSubject
    await this.loadData();

    this.status = ServiceStatus.INITIALIZED;

    // Start service
    await this.start();

    // Handle events
    this.eventService.onLazy(this.handleEvents.bind(this));
  }

  async loadData () {
    const backupBalanceData = await this.dbService.getStoredBalance();

    this.balanceMap.updateBalanceItems(backupBalanceData, true);
  }

  async start (): Promise<void> {
    if (this.status === ServiceStatus.STOPPING) {
      await this.waitForStopped();
    }

    if (this.status === ServiceStatus.STARTED || this.status === ServiceStatus.STARTING) {
      return await this.waitForStarted();
    }

    this.status = ServiceStatus.STARTING;

    // Run subscribe balance
    await this.runSubscribeBalances();

    // Update status
    this.stopPromiseHandler = createPromiseHandler();
    this.status = ServiceStatus.STARTED;
    this.startPromiseHandler.resolve();
  }

  async stop (): Promise<void> {
    if (this.status === ServiceStatus.STARTING) {
      await this.waitForStarted();
    }

    if (this.status === ServiceStatus.STOPPED || this.status === ServiceStatus.STOPPING) {
      return await this.waitForStopped();
    }

    this.runUnsubscribeBalances();

    // Update status
    this.startPromiseHandler = createPromiseHandler();
    this.status = ServiceStatus.STOPPING;
    this.stopPromiseHandler.resolve();
  }

  waitForStarted (): Promise<void> {
    return this.startPromiseHandler.promise;
  }

  waitForStopped (): Promise<void> {
    return this.stopPromiseHandler.promise;
  }

  handleEvents (events: EventItem<EventType>[], eventTypes: EventType[]) {
    (async () => {
      const removedAddresses: string[] = [];

      // Account changed or chain changed (active or inactive)
      if (eventTypes.includes('account.updateCurrent') || eventTypes.includes('chain.updateState')) {
        await this.runSubscribeBalances();
      }

      events.forEach((event) => {
        if (event.type === 'account.remove') {
          removedAddresses.push(event.data[0] as string);
        }
      });

      if (removedAddresses.length > 0) {
        this.balanceMap.removeBalanceItems([...removedAddresses, ALL_ACCOUNT_KEY]);
        await this.runSubscribeBalances();
      }
    })().catch(console.error);
  }

  /* Subscribe token free balance on chain */
  public async subscribeTokenFreeBalance (address: string, chain: string, tokenSlug: string | undefined, callback?: (rs: AmountData) => void): Promise<[() => void, AmountData]> {
    const chainInfo = this.state.chainService.getChainInfoByKey(chain);
    const chainState = this.state.chainService.getChainStateByKey(chain);

    if (!chainInfo || !chainState || !chainState.active) {
      return Promise.reject(new BalanceError(BalanceErrorType.NETWORK_ERROR, t('{{chain}} is inactive. Please enable network', { replace: { chain: chainInfo.name } })));
    }

    const tSlug = tokenSlug || _getChainNativeTokenSlug(chainInfo);
    const tokenInfo = this.state.chainService.getAssetBySlug(tSlug);

    if (!tokenInfo) {
      return Promise.reject(new BalanceError(BalanceErrorType.TOKEN_ERROR, t('Transfer is currently not available for this token: {{tSlug}}', { replace: { slug: tSlug } })));
    }

    return new Promise((resolve, reject) => {
      let hasError = true;

      const unsub = this.subscribeBalance([address], [chain], (rs) => {
        if (rs.tokenSlug === tSlug) {
          hasError = false;
          const balance = {
            value: rs.free,
            decimals: tokenInfo.decimals || 0,
            symbol: tokenInfo.symbol
          };

          if (callback) {
            callback(balance);
          } else {
            // Auto unsubscribe if no callback
            unsub();
          }

          resolve([unsub, balance]);
        }
      });

      setTimeout(() => {
        if (hasError) {
          unsub();
          reject(new Error(t('Failed to get balance. Please check your internet connection or change your network endpoint')));
        }
      }, 9999);
    });
  }

  /**
   * @public
   * @async
   * @function getTokenFreeBalance
   * @desc Fetch free balance on chain
   * @param {string} address - Address
   * @param {string} chain - Slug of chain
   * @param {string} [tokenSlug] - Slug of token
   * @return {Promise<AmountData>} - Free token balance of address on chain
  */
  public async getTokenFreeBalance (address: string, chain: string, tokenSlug?: string): Promise<AmountData> {
    const [, balance] = await this.subscribeTokenFreeBalance(address, chain, tokenSlug);

    return balance;
  }

  public subscribeBalance (addresses: string[], chains: string[] | null, _callback: (rs: BalanceItem) => void) {
    const [substrateAddresses, evmAddresses] = categoryAddresses(addresses);
    const chainInfoMap = this.state.chainService.getChainInfoMap();
    const chainStateMap = this.state.chainService.getChainStateMap();
    const substrateApiMap = this.state.chainService.getSubstrateApiMap();
    const evmApiMap = this.state.chainService.getEvmApiMap();

    // Get data from chain or all chains
    const chainList = chains || Object.keys(chainInfoMap);
    // Filter active chain only
    const useChainInfos = chainList.filter((c) => chainStateMap[c] && chainStateMap[c].active).map((c) => chainInfoMap[c]);

    const callback = (items: BalanceItem[]) => {
      if (items.length) {
        _callback(groupBalance(items, 'GROUPED', items[0].tokenSlug));
      }
    };

    // Looping over each chain
    const unsubList = useChainInfos.map(async (chainInfo) => {
      const chainSlug = chainInfo.slug;
      const useAddresses = _isChainEvmCompatible(chainInfo) ? evmAddresses : substrateAddresses;

      if (_isPureEvmChain(chainInfo)) {
        const nativeTokenInfo = this.state.getNativeTokenInfo(chainSlug);

        return subscribeEVMBalance(chainSlug, useAddresses, evmApiMap, callback, nativeTokenInfo);
      }

      if (!useAddresses || useAddresses.length === 0 || _PURE_EVM_CHAINS.indexOf(chainSlug) > -1) {
        return undefined;
      }

      const networkAPI = await substrateApiMap[chainSlug].isReady;

      return subscribeSubstrateBalance(useAddresses, chainInfo, chainSlug, networkAPI, evmApiMap, callback);
    });

    return () => {
      unsubList.forEach((subProm) => {
        subProm.then((unsub) => {
          unsub && unsub();
        }).catch(console.error);
      });
    };
  }

  public removeBalanceByAddresses (addresses: string[]) {
    this.balanceMap.removeBalanceItems([...addresses, ALL_ACCOUNT_KEY]);
  }

  public async removeInactiveChainBalances () {
    const assetSettings = await this.chainService.getAssetSettings();

    this.balanceMap.removeBalanceItemByFilter((item) => {
      return !assetSettings[item.tokenSlug];
    });
  }

  public async getBalance (reset?: boolean) {
    await this.removeInactiveChainBalances();

    return { details: this.balanceMap.map, reset } as BalanceJson;
  }

  public async getStoredBalance (address: string) {
    return await this.dbService.stores.balance.getBalanceMapByAddresses(address);
  }

  public async handleResetBalance (forceRefresh?: boolean) {
    if (forceRefresh) {
      this.balanceMap.setData({});
      await this.dbService.stores.balance.clear();
    } else {
      await Promise.all([this.removeInactiveChainBalances()]);
    }
  }

  private balanceUpdateCache: BalanceItem[] = [];

  /** Note: items must be same tokenSlug */
  public setBalanceItem (items: BalanceItem[]) {
    if (items.length) {
      const nowTime = new Date().getTime();

      for (const item of items) {
        const balance: BalanceItem = { timestamp: nowTime, ...item };

        this.balanceUpdateCache.push(balance);
      }

      addLazy('updateBalanceStore', () => {
        const isAllAccount = isAccountAll(this.keyringService.currentAccount.address);

        this.balanceMap.updateBalanceItems(this.balanceUpdateCache, isAllAccount);

        if (isAllAccount) {
          this.balanceUpdateCache = [...this.balanceUpdateCache, ...Object.values(this.balanceMap.map[ALL_ACCOUNT_KEY])];
        }

        this.updateBalanceStore(this.balanceUpdateCache);
        this.balanceUpdateCache = [];
      }, 300, 1800);
    }
  }

  private updateBalanceStore (items: BalanceItem[]) {
    this.dbService.updateBulkBalanceStore(items).catch(console.warn);
  }

  public subscribeBalanceMap () {
    return this.balanceMap.mapSubject;
  }

  private _unsubscribeBalance: VoidFunction | undefined;

  async runSubscribeBalances () {
    await Promise.all([this.eventService.waitKeyringReady, this.eventService.waitChainReady]);
    this.runUnsubscribeBalances();

    const addresses = this.state.getDecodedAddresses();

    if (!addresses.length) {
      return;
    }

    // Reset balance before subscribe
    await this.handleResetBalance();

    const activeChainSlugs = Object.keys(this.state.getActiveChainInfoMap());
    const unsub = this.subscribeBalance(addresses, activeChainSlugs, (result) => {
      this.setBalanceItem([result]);
    });

    const unsub2 = this.state.subscribeMantaPayBalance();

    this._unsubscribeBalance = () => {
      unsub && unsub();
      unsub2 && unsub2();
    };
  }

  runUnsubscribeBalances () {
    this._unsubscribeBalance && this._unsubscribeBalance();
    this._unsubscribeBalance = undefined;
  }

  async reloadBalance () {
    await this.handleResetBalance(true);
    await this.runSubscribeBalances();

    await waitTimeout(1800);
  }
}
