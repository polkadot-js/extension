// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { AccountJson } from '@subwallet/extension-base/background/types';
import { state } from '@subwallet/extension-base/koni/background/handlers';
import { _EvmApi, _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getSubstrateGenesisHash, _isChainEvmCompatible, _isPureEvmChain } from '@subwallet/extension-base/services/chain-service/utils';
import { BalanceItem } from '@subwallet/extension-base/types';
import { categoryAddresses } from '@subwallet/extension-base/utils';
import keyring from '@subwallet/ui-keyring';

import { subscribeEVMBalance } from './evm';
import { subscribeSubstrateBalance } from './substrate';

const filterAddress = (addresses: string[], chainInfo: _ChainInfo): string[] => {
  const isEvmChain = _isChainEvmCompatible(chainInfo);
  const [substrateAddresses, evmAddresses] = categoryAddresses(addresses);

  if (isEvmChain) {
    return evmAddresses;
  } else {
    return substrateAddresses.filter((address) => {
      try {
        const pair = keyring.getPair(address);

        if (pair) {
          const account: AccountJson = {
            address: pair.address,
            type: pair.type,
            ...pair.meta
          };

          if (account.isHardware) {
            const availGen = account.availableGenesisHashes || [];
            const gen = _getSubstrateGenesisHash(chainInfo);

            return availGen.includes(gen);
          } else {
            return true;
          }
        } else {
          return false;
        }
      } catch (e) {
        return false;
      }
    });
  }
};

// main subscription
export function subscribeBalance (addresses: string[], chainInfoMap: Record<string, _ChainInfo>, substrateApiMap: Record<string, _SubstrateApi>, evmApiMap: Record<string, _EvmApi>, callback: (rs: BalanceItem[]) => void) {
  // Looping over each chain
  const unsubList = Object.entries(chainInfoMap).map(async ([chainSlug, chainInfo]) => {
    const useAddresses = filterAddress(addresses, chainInfo);

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
