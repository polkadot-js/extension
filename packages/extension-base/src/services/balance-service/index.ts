// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BalanceError } from '@subwallet/extension-base/background/errors/BalanceError';
import { AmountData, BalanceErrorType, DetectBalanceCache } from '@subwallet/extension-base/background/KoniTypes';
import KoniState from '@subwallet/extension-base/koni/background/handlers/State';
import { groupBalance } from '@subwallet/extension-base/services/balance-service/helpers/group';
import { subscribeEVMBalance } from '@subwallet/extension-base/services/balance-service/helpers/subscribe/evm';
import { subscribeSubstrateBalance } from '@subwallet/extension-base/services/balance-service/helpers/subscribe/substrate';
import { _PURE_EVM_CHAINS } from '@subwallet/extension-base/services/chain-service/constants';
import { _getChainNativeTokenSlug, _isChainEvmCompatible, _isPureEvmChain } from '@subwallet/extension-base/services/chain-service/utils';
import DetectAccountBalanceStore from '@subwallet/extension-base/stores/DetectAccountBalance';
import { BalanceItem } from '@subwallet/extension-base/types';
import { categoryAddresses, createPromiseHandler, PromiseHandler } from '@subwallet/extension-base/utils';
import keyring from '@subwallet/ui-keyring';
import { t } from 'i18next';
import { BehaviorSubject } from 'rxjs';

import { noop } from '@polkadot/util';

/**
 * Balance service
 * @class
*/
export class BalanceService {
  private readonly state: KoniState;
  private readonly detectAccountBalanceStore = new DetectAccountBalanceStore();
  private readonly balanceDetectSubject: BehaviorSubject<DetectBalanceCache> = new BehaviorSubject<DetectBalanceCache>({});
  private readonly intervalTime = 3 * 60 * 1000;
  private readonly cacheTime = 15 * 60 * 1000;
  private readonly startHandler: PromiseHandler<void>;
  /**
   * @constructor
   * @param {KoniState} state - The state of extension.
   */
  constructor (state: KoniState) {
    this.state = state;
    // Todo: Load data from db to balanceSubject
    // Todo: Start  subscribe balance and data
    // Todo: Listen change and apply to balanceSubject
    // Todo: Active/Chain
    // Todo: Add/remove account
    // Todo: Add new account
    // Todo: Optimize get balance for single account and chain with cache
    // Todo: Move everything of fetching balance to this service

    this.startHandler = createPromiseHandler<void>();

    const updateBalanceDetectCache = (value: DetectBalanceCache) => {
      this.startHandler.resolve();
      this.balanceDetectSubject.next(value || {});
    };

    this.getBalanceDetectCache(updateBalanceDetectCache);
    this.detectAccountBalanceStore.getSubject().subscribe({ next: updateBalanceDetectCache });

    this.startDetectBalance().catch(console.error);
  }

  async startDetectBalance () {
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

    await this.state.eventService.waitAccountReady;
    await this.state.eventService.waitChainReady;
    await this.startHandler.promise;

    scanBalance();
    setInterval(scanBalance, this.intervalTime);
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
}
