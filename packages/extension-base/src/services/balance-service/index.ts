// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BalanceError } from '@subwallet/extension-base/background/errors/BalanceError';
import { AmountData, BalanceErrorType, BalanceItem } from '@subwallet/extension-base/background/KoniTypes';
import KoniState from '@subwallet/extension-base/koni/background/handlers/State';
import { subscribeEVMBalance } from '@subwallet/extension-base/services/balance-service/helpers/evm';
import { subscribeSubstrateBalance } from '@subwallet/extension-base/services/balance-service/helpers/substrate';
import { _PURE_EVM_CHAINS } from '@subwallet/extension-base/services/chain-service/constants';
import { _getChainNativeTokenSlug, _isChainEvmCompatible, _isPureEvmChain } from '@subwallet/extension-base/services/chain-service/utils';
import { categoryAddresses } from '@subwallet/extension-base/utils';
import { t } from 'i18next';

/**
 * Balance service
 * @class
*/
export class BalanceService {
  private state: KoniState;

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
  }

  /* Subscribe token free balance on chain */
  public async subscribeTokenFreeBalance (address: string, chain: string, tokenSlug: string | undefined, callback?: (rs: AmountData) => void): Promise<[() => void, AmountData]> {
    const chainInfo = this.state.chainService.getChainInfoByKey(chain);
    const chainState = this.state.chainService.getChainStateByKey(chain);

    if (!chainInfo || !chainState || !chainState.active) {
      return Promise.reject(new BalanceError(BalanceErrorType.NETWORK_ERROR, t('{{chain}} is inactive. Please enable network', { replace: { chain } })));
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

  public subscribeBalance (addresses: string[], chains: string[] | null, callback: (rs: BalanceItem) => void) {
    const [substrateAddresses, evmAddresses] = categoryAddresses(addresses);
    const chainInfoMap = this.state.chainService.getChainInfoMap();
    const chainStateMap = this.state.chainService.getChainStateMap();
    const substrateApiMap = this.state.chainService.getSubstrateApiMap();
    const evmApiMap = this.state.chainService.getEvmApiMap();

    // Get data from chain or all chains
    const chainList = chains || Object.keys(chainInfoMap);
    // Filter active chain only
    const useChainInfos = chainList.filter((c) => chainStateMap[c] && chainStateMap[c].active).map((c) => chainInfoMap[c]);

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
}
