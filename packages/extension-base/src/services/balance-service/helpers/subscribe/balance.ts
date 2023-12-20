// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _AssetType, _ChainInfo } from '@subwallet/chain-list/types';
import { APIItemState } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson } from '@subwallet/extension-base/background/types';
import { SWHandler } from '@subwallet/extension-base/koni/background/handlers';
import { _EvmApi, _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getSubstrateGenesisHash, _isChainEvmCompatible, _isPureEvmChain } from '@subwallet/extension-base/services/chain-service/utils';
import { BalanceItem } from '@subwallet/extension-base/types';
import { categoryAddresses } from '@subwallet/extension-base/utils';
import keyring from '@subwallet/ui-keyring';

import { subscribeEVMBalance } from './evm';
import { subscribeSubstrateBalance } from './substrate';

/**
 * @function getAccountJsonByAddress
 * @desc Get account info by address
 * <p>
 *   Note: Use on the background only
 * </p>
 * @param {string} address - Address
 * @returns {AccountJson|null}  - Account info or null if not found
 */
export const getAccountJsonByAddress = (address: string): AccountJson | null => {
  try {
    const pair = keyring.getPair(address);

    if (pair) {
      return {
        address: pair.address,
        type: pair.type,
        ...pair.meta
      };
    } else {
      return null;
    }
  } catch (e) {
    console.warn(e);

    return null;
  }
};

const filterAddress = (addresses: string[], chainInfo: _ChainInfo): [string[], string[]] => {
  const isEvmChain = _isChainEvmCompatible(chainInfo);
  const [substrateAddresses, evmAddresses] = categoryAddresses(addresses);

  if (isEvmChain) {
    return [evmAddresses, []];
  } else {
    const fetchList: string[] = [];
    const unfetchList: string[] = [];

    substrateAddresses.forEach((address) => {
      const account = getAccountJsonByAddress(address);

      if (account) {
        if (account.isHardware) {
          const availGen = account.availableGenesisHashes || [];
          const gen = _getSubstrateGenesisHash(chainInfo);

          if (availGen.includes(gen)) {
            fetchList.push(address);
          } else {
            unfetchList.push(address);
          }
        } else {
          fetchList.push(address);
        }
      } else {
        fetchList.push(address);
      }
    });

    return [fetchList, [...unfetchList, ...evmAddresses]];
  }
};

// main subscription
export function subscribeBalance (addresses: string[], chainInfoMap: Record<string, _ChainInfo>, substrateApiMap: Record<string, _SubstrateApi>, evmApiMap: Record<string, _EvmApi>, callback: (rs: BalanceItem[]) => void) {
  const state = SWHandler.instance.state;
  // Looping over each chain
  const unsubList = Object.entries(chainInfoMap).map(async ([chainSlug, chainInfo]) => {
    const [useAddresses, notSupportAddresses] = filterAddress(addresses, chainInfo);

    if (notSupportAddresses.length) {
      const tokens = state.chainService.getAssetByChainAndType(chainSlug, [_AssetType.NATIVE, _AssetType.ERC20, _AssetType.PSP22, _AssetType.LOCAL]);
      const assetSetting = await state.chainService.getAssetSettings();
      const filtered = Object.values(tokens).filter(({ slug }) => {
        return assetSetting[slug]?.visible;
      });

      const now = new Date().getTime();

      notSupportAddresses.forEach((address) => {
        const items: BalanceItem[] = filtered.map((token): BalanceItem => {
          return {
            address,
            tokenSlug: token.slug,
            free: '0',
            locked: '0',
            state: APIItemState.NOT_SUPPORT,
            timestamp: now
          };
        });

        callback(items);
      });
    }

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
