// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { BalanceItem } from '@subwallet/extension-base/background/KoniTypes';
import { state } from '@subwallet/extension-base/koni/background/handlers';
import { _EvmApi, _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _isChainEvmCompatible, _isPureEvmChain } from '@subwallet/extension-base/services/chain-service/utils';
import { categoryAddresses } from '@subwallet/extension-base/utils';

import { subscribeEVMBalance } from './evm';
import { subscribeSubstrateBalance } from './substrate';

// main subscription
export function subscribeBalance (addresses: string[], chainInfoMap: Record<string, _ChainInfo>, substrateApiMap: Record<string, _SubstrateApi>, evmApiMap: Record<string, _EvmApi>, callback: (rs: BalanceItem[]) => void) {
  const [substrateAddresses, evmAddresses] = categoryAddresses(addresses);

  // Looping over each chain
  const unsubList = Object.entries(chainInfoMap).map(async ([chainSlug, chainInfo]) => {
    const useAddresses = _isChainEvmCompatible(chainInfo) ? evmAddresses : substrateAddresses;

    if (_isPureEvmChain(chainInfo)) {
      const nativeTokenInfo = state.getNativeTokenInfo(chainSlug);

      return subscribeEVMBalance(chainSlug, useAddresses, evmApiMap, callback, nativeTokenInfo);
    }

    // if (!useAddresses || useAddresses.length === 0 || _PURE_EVM_CHAINS.indexOf(chainSlug) > -1) {
    //   const fungibleTokensByChain = state.chainService.getFungibleTokensByChain(chainSlug, true);
    //   const now = new Date().getTime();
    //
    //   Object.values(fungibleTokensByChain).map((token) => {
    //     return {
    //       tokenSlug: token.slug,
    //       free: '0',
    //       locked: '0',
    //       state: APIItemState.READY,
    //       timestamp: now
    //     } as BalanceItem;
    //   }).forEach(callback);
    //
    //   return undefined;
    // }

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
