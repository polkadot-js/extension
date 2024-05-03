// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BalanceError } from '@subwallet/extension-base/background/errors/BalanceError';
import { AmountData, BalanceErrorType, DetectBalanceCache } from '@subwallet/extension-base/background/KoniTypes';
import { ALL_ACCOUNT_KEY } from '@subwallet/extension-base/constants';
import KoniState from '@subwallet/extension-base/koni/background/handlers/State';
import { ServiceStatus, StoppableServiceInterface } from '@subwallet/extension-base/services/base/types';
import { _getChainNativeTokenSlug } from '@subwallet/extension-base/services/chain-service/utils';
import { EventItem, EventType } from '@subwallet/extension-base/services/event-service/types';
import DetectAccountBalanceStore from '@subwallet/extension-base/stores/DetectAccountBalance';
import { BalanceItem, BalanceJson } from '@subwallet/extension-base/types';
import { addLazy, createPromiseHandler, isAccountAll, PromiseHandler, waitTimeout } from '@subwallet/extension-base/utils';
import keyring from '@subwallet/ui-keyring';
import { t } from 'i18next';
import { BehaviorSubject } from 'rxjs';

import { noop } from '@polkadot/util';

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

  private isReload = false;

  private readonly detectAccountBalanceStore = new DetectAccountBalanceStore();
  private readonly balanceDetectSubject: BehaviorSubject<DetectBalanceCache> = new BehaviorSubject<DetectBalanceCache>({});
  private readonly intervalTime = 3 * 60 * 1000;
  private readonly cacheTime = 15 * 60 * 1000;

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

    await this.startScanBalance();

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
    this.stopScanBalance();

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

    let lazyTime = 2000;

    // Account changed or chain changed (active or inactive)
    if (eventTypes.includes('account.updateCurrent') || eventTypes.includes('account.add') || eventTypes.includes('chain.updateState') || eventTypes.includes('asset.updateState')) {
      needReload = true;

      if (eventTypes.includes('account.updateCurrent')) {
        lazyTime = 1000;
      }
    }

    events.forEach((event) => {
      if (event.type === 'account.remove') {
        removedAddresses.push(event.data[0] as string);
        lazyTime = 1000;
      }
    });

    if (removedAddresses.length > 0) {
      this.balanceMap.removeBalanceItems([...removedAddresses, ALL_ACCOUNT_KEY]); // Add all account key to recalculate all account balances
      needReload = true;
    }

    if (needReload) {
      addLazy('reloadBalanceByEvents', () => {
        if (!this.isReload) {
          this.runSubscribeBalances().catch(console.error);
        }
      }, lazyTime, undefined, true);
    }
  }

  public getBalanceDetectCache (update: (value: DetectBalanceCache) => void): void {
    this.detectAccountBalanceStore.get('DetectBalanceCache', (value) => {
      update(value);
    });
  }

  public setBalanceDetectCache (addresses: string[]): void {
    this.detectAccountBalanceStore.get('DetectBalanceCache', (value) => {
      const rs = { ...value };

      for (const address of addresses) {
        rs[address] = Date.now();
      }

      this.detectAccountBalanceStore.set('DetectBalanceCache', rs);
    });
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

      let unsub = noop;

      unsub = subscribeBalance([address], [chain], [tSlug], assetMap, chainInfoMap, substrateApiMap, evmApiMap, (result) => {
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
            unsub?.();
          }

          resolve([unsub, balance]);
        }
      });

      setTimeout(() => {
        if (hasError) {
          unsub?.();
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

    let cancel = false;
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
      !cancel && this.setBalanceItem(result);
    });

    const unsub2 = this.state.subscribeMantaPayBalance();

    this._unsubscribeBalance = () => {
      cancel = true;
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
    this.isReload = true;
    await this.handleResetBalance(true);
    await this.runSubscribeBalances();

    await waitTimeout(1800);
    this.isReload = false;
  }

  /** Subscribe area */

  public async autoEnableChains (addresses: string[]) {
    this.setBalanceDetectCache(addresses);
    const assetMap = this.state.chainService.getAssetRegistry();
    const promiseList = addresses.map((address) => {
      return this.state.subscanService.getMultiChainBalance(address)
        .catch((e) => {
          console.error(e);

          return null;
        });
    });

    const needEnableChains: string[] = [];
    const needActiveTokens: string[] = [];
    const balanceDataList = await Promise.all(promiseList);
    const currentAssetSettings = await this.state.chainService.getAssetSettings();
    const chainInfoMap = this.state.chainService.getChainInfoMap();
    const detectBalanceChainSlugMap = this.state.chainService.detectBalanceChainSlugMap;

    for (const balanceData of balanceDataList) {
      if (balanceData) {
        for (const balanceDatum of balanceData) {
          const { balance, bonded, category, locked, network, symbol } = balanceDatum;
          const chain = detectBalanceChainSlugMap[network];
          const chainInfo = chain ? chainInfoMap[chain] : null;
          const chainState = this.state.chainService.getChainStateByKey(chain);
          const balanceIsEmpty = (!balance || balance === '0') && (!locked || locked === '0') && (!bonded || bonded === '0');
          const tokenKey = `${chain}-${category === 'native' ? 'NATIVE' : 'LOCAL'}-${symbol.toUpperCase()}`;
          const existedKey = Object.keys(assetMap).find((v) => v.toLowerCase() === tokenKey.toLowerCase());

          // Cancel if chain is not supported or is testnet
          if (!chainInfo || chainInfo.isTestnet) {
            continue;
          }

          // Cancel is balance is 0
          if (balanceIsEmpty) {
            continue;
          }

          // Cancel is chain is turned off by user
          if (chainState && chainState.manualTurnOff) {
            continue;
          }

          // const a = this.state.chainService.getChainStateByKey(chain);

          if (existedKey && !currentAssetSettings[existedKey]?.visible) {
            needEnableChains.push(chain);
            needActiveTokens.push(existedKey);
            currentAssetSettings[existedKey] = { visible: true };
          }
        }
      }
    }

    if (needActiveTokens.length) {
      await this.state.chainService.enableChains(needEnableChains);
      this.state.chainService.setAssetSettings({ ...currentAssetSettings });
    }
  }

  private _intervalScan: NodeJS.Timer | undefined;
  private _unsubscribeBalanceDetectCache: VoidFunction | undefined;
  private startBalanceDetectCache: PromiseHandler<void> | undefined;

  private async startScanBalance () {
    await Promise.all([this.state.eventService.waitAccountReady, this.state.eventService.waitChainReady]);
    this.stopScanBalance();
    this.startBalanceDetectCache = createPromiseHandler<void>();

    const updateBalanceDetectCache = (value: DetectBalanceCache) => {
      this.startBalanceDetectCache?.resolve();
      this.balanceDetectSubject.next(value || {});
    };

    this.getBalanceDetectCache(updateBalanceDetectCache);
    const subscription = this.detectAccountBalanceStore.getSubject().subscribe({ next: updateBalanceDetectCache });

    this._unsubscribeBalanceDetectCache = subscription.unsubscribe;

    const scanBalance = () => {
      const addresses = keyring.getPairs().map((account) => account.address);
      const cache = this.balanceDetectSubject.value;
      const now = Date.now();
      const needDetectAddresses: string[] = [];

      for (const address of addresses) {
        if (!cache[address] || now - cache[address] > this.cacheTime) {
          needDetectAddresses.push(address);
        }
      }

      if (needDetectAddresses.length) {
        this.autoEnableChains(needDetectAddresses).finally(noop);
      }
    };

    await this.startBalanceDetectCache?.promise;

    scanBalance();
    this._intervalScan = setInterval(scanBalance, this.intervalTime);
  }

  private stopScanBalance () {
    this._intervalScan && clearInterval(this._intervalScan);
    this._unsubscribeBalanceDetectCache && this._unsubscribeBalanceDetectCache();
    this._intervalScan = undefined;
    this._unsubscribeBalanceDetectCache = undefined;
    this.startBalanceDetectCache = undefined;
  }
}
