// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BalanceError } from '@subwallet/extension-base/background/errors/BalanceError';
import { AmountData, BalanceErrorType } from '@subwallet/extension-base/background/KoniTypes';
import { ALL_ACCOUNT_KEY } from '@subwallet/extension-base/constants';
import KoniState from '@subwallet/extension-base/koni/background/handlers/State';
import { ServiceStatus, StoppableServiceInterface } from '@subwallet/extension-base/services/base/types';
import { _getChainNativeTokenSlug } from '@subwallet/extension-base/services/chain-service/utils';
import { EventItem, EventType } from '@subwallet/extension-base/services/event-service/types';
import { BalanceItem, BalanceJson } from '@subwallet/extension-base/types';
import { addLazy, createPromiseHandler, isAccountAll, PromiseHandler, waitTimeout } from '@subwallet/extension-base/utils';
import { t } from 'i18next';

import { BalanceMapImpl } from './BalanceMapImpl';
import { subscribeBalance } from './helpers';

/**
 * Balance service
 * @class
*/
export class BalanceService implements StoppableServiceInterface {
  private state: KoniState;
  private balanceMap: BalanceMapImpl;
  private balanceUpdateCache: BalanceItem[] = [];

  startPromiseHandler: PromiseHandler<void> = createPromiseHandler();
  stopPromiseHandler: PromiseHandler<void> = createPromiseHandler();
  status: ServiceStatus = ServiceStatus.NOT_INITIALIZED;

  /**
   * @constructor
   * @param {KoniState} state - The state of extension.
   */
  constructor (state: KoniState) {
    this.state = state;
    this.balanceMap = new BalanceMapImpl();
  }

  /** Init service */
  async init (): Promise<void> {
    this.status = ServiceStatus.INITIALIZING;
    await this.state.eventService.waitChainReady;
    await this.state.eventService.waitAccountReady;

    // Load data from db to balanceSubject
    await this.loadData();

    this.status = ServiceStatus.INITIALIZED;

    // Start service
    await this.start();

    // Handle events
    this.state.eventService.onLazy(this.handleEvents.bind(this));
  }

  /** Restore balance map */
  async loadData () {
    const backupBalanceData = await this.state.dbService.getStoredBalance();

    this.balanceMap.updateBalanceItems(backupBalanceData, true);
  }

  /** Start service */
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

  /** Stop service */
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

  /** Wait service start */
  waitForStarted (): Promise<void> {
    return this.startPromiseHandler.promise;
  }

  /** Wait service stop */
  waitForStopped (): Promise<void> {
    return this.stopPromiseHandler.promise;
  }

  /**
   *  Handle when data change
   *  */
  handleEvents (events: EventItem<EventType>[], eventTypes: EventType[]) {
    const removedAddresses: string[] = [];
    let needReload = false;

    // Account changed or chain changed (active or inactive)
    if (eventTypes.includes('account.updateCurrent') || eventTypes.includes('chain.updateState') || eventTypes.includes('asset.updateState')) {
      needReload = true;
    }

    events.forEach((event) => {
      if (event.type === 'account.remove') {
        removedAddresses.push(event.data[0] as string);
      }
    });

    if (removedAddresses.length > 0) {
      this.balanceMap.removeBalanceItems([...removedAddresses, ALL_ACCOUNT_KEY]); // Add all account key to recalculate all account balances
      needReload = true;
    }

    if (needReload) {
      this.runSubscribeBalances().catch(console.error);
    }
  }

  /** Subscribe token free balance of a address on chain */
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

      const assetMap = this.state.chainService.getAssetRegistry();
      const chainInfoMap = this.state.chainService.getChainInfoMap();
      const evmApiMap = this.state.chainService.getEvmApiMap();
      const substrateApiMap = this.state.chainService.getSubstrateApiMap();

      const unsub = subscribeBalance([address], [chain], [tSlug], assetMap, chainInfoMap, substrateApiMap, evmApiMap, (result) => {
        const rs = result[0];

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

  /** Remove balance from the subject object by addresses */
  public removeBalanceByAddresses (addresses: string[]) {
    this.balanceMap.removeBalanceItems([...addresses, ALL_ACCOUNT_KEY]);
  }

  /** Remove inactive asset from the balance map */
  public async removeInactiveChainBalances () {
    const assetSettings = await this.state.chainService.getAssetSettings();

    this.balanceMap.removeBalanceItemByFilter((item) => {
      return !assetSettings[item.tokenSlug];
    });
  }

  public async getBalance (reset?: boolean) {
    await this.removeInactiveChainBalances();

    return { details: this.balanceMap.map, reset } as BalanceJson;
  }

  /** Get stored balance from db */
  public async getStoredBalance (address: string) {
    return await this.state.dbService.stores.balance.getBalanceMapByAddresses(address);
  }

  public async handleResetBalance (forceRefresh?: boolean) {
    if (forceRefresh) {
      this.balanceMap.setData({});
      await this.state.dbService.stores.balance.clear();
    } else {
      await Promise.all([this.removeInactiveChainBalances()]);
    }
  }

  /**
   * Update value for balance map
   * Note: items must be same tokenSlug */
  public setBalanceItem (items: BalanceItem[]) {
    if (items.length) {
      const nowTime = new Date().getTime();

      for (const item of items) {
        const balance: BalanceItem = { timestamp: nowTime, ...item };

        this.balanceUpdateCache.push(balance);
      }

      addLazy('updateBalanceStore', () => {
        const isAllAccount = isAccountAll(this.state.keyringService.currentAccount.address);

        this.balanceMap.updateBalanceItems(this.balanceUpdateCache, isAllAccount);

        if (isAllAccount) {
          this.balanceUpdateCache = [...this.balanceUpdateCache, ...Object.values(this.balanceMap.map[ALL_ACCOUNT_KEY])];
        }

        this.updateBalanceStore(this.balanceUpdateCache);
        this.balanceUpdateCache = [];
      }, 300, 1800);
    }
  }

  /**
   * Store balance map to db
   * */
  private updateBalanceStore (items: BalanceItem[]) {
    this.state.dbService.updateBulkBalanceStore(items).catch(console.warn);
  }

  /**
   * Subscribe balance map with subject object
   * */
  public subscribeBalanceMap () {
    return this.balanceMap.mapSubject;
  }

  /** Subscribe area */

  private _unsubscribeBalance: VoidFunction | undefined;

  /** Subscribe balance subscription */
  async runSubscribeBalances () {
    await Promise.all([this.state.eventService.waitKeyringReady, this.state.eventService.waitChainReady]);
    this.runUnsubscribeBalances();

    const addresses = this.state.getDecodedAddresses();

    if (!addresses.length) {
      return;
    }

    // Reset balance before subscribe
    await this.handleResetBalance();

    const assetMap = this.state.chainService.getAssetRegistry();
    const chainInfoMap = this.state.chainService.getChainInfoMap();
    const evmApiMap = this.state.chainService.getEvmApiMap();
    const substrateApiMap = this.state.chainService.getSubstrateApiMap();

    const activeChainSlugs = Object.keys(this.state.getActiveChainInfoMap());
    const assetState = this.state.chainService.subscribeAssetSettings().value;
    const assets: string[] = Object.values(assetMap)
      .filter((asset) => {
        return activeChainSlugs.includes(asset.originChain) && assetState[asset.slug]?.visible;
      })
      .map((asset) => asset.slug);

    const unsub = subscribeBalance(addresses, activeChainSlugs, assets, assetMap, chainInfoMap, substrateApiMap, evmApiMap, (result) => {
      this.setBalanceItem(result);
    });

    const unsub2 = this.state.subscribeMantaPayBalance();

    this._unsubscribeBalance = () => {
      unsub && unsub();
      unsub2 && unsub2();
    };
  }

  /** Unsubscribe balance subscription */
  runUnsubscribeBalances () {
    this._unsubscribeBalance && this._unsubscribeBalance();
    this._unsubscribeBalance = undefined;
  }

  /** Reload balance subscription */
  async reloadBalance () {
    await this.handleResetBalance(true);
    await this.runSubscribeBalances();

    await waitTimeout(1800);
  }

  /** Subscribe area */
}
