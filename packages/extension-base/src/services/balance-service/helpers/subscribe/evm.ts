// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _AssetType } from '@subwallet/chain-list/types';
import { APIItemState } from '@subwallet/extension-base/background/KoniTypes';
import { ASTAR_REFRESH_BALANCE_INTERVAL, SUB_TOKEN_REFRESH_BALANCE_INTERVAL } from '@subwallet/extension-base/constants';
import { getERC20Contract } from '@subwallet/extension-base/koni/api/contract-handler/evm/web3';
import { _EvmApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getContractAddressOfToken } from '@subwallet/extension-base/services/chain-service/utils';
import { BalanceItem, SubscribeEvmPalletBalance } from '@subwallet/extension-base/types';
import { filterAssetsByChainAndType } from '@subwallet/extension-base/utils';
import { Contract } from 'web3-eth-contract';

import { BN } from '@polkadot/util';

export function subscribeERC20Interval ({ addresses, assetMap, callback, chainInfo, evmApi }: SubscribeEvmPalletBalance): () => void {
  const chain = chainInfo.slug;
  const tokenList = filterAssetsByChainAndType(assetMap, chain, [_AssetType.ERC20]);
  const erc20ContractMap = {} as Record<string, Contract>;

  Object.entries(tokenList).forEach(([slug, tokenInfo]) => {
    erc20ContractMap[slug] = getERC20Contract(_getContractAddressOfToken(tokenInfo), evmApi);
  });

  const getTokenBalances = () => {
    Object.values(tokenList).map(async (tokenInfo) => {
      try {
        const contract = erc20ContractMap[tokenInfo.slug];
        const balances = await Promise.all(addresses.map(async (address): Promise<string> => {
          try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
            return await contract.methods.balanceOf(address).call();
          } catch (e) {
            console.error(`Error on get balance of account ${address} for token ${tokenInfo.slug}`, e);

            return '0';
          }
        }));

        const items: BalanceItem[] = balances.map((balance, index): BalanceItem => {
          return {
            address: addresses[index],
            tokenSlug: tokenInfo.slug,
            free: new BN(balance || 0).toString(),
            locked: '0',
            state: APIItemState.READY
          };
        });

        callback(items);
      } catch (err) {
        console.log(tokenInfo.slug, err);
      }
    });
  };

  getTokenBalances();

  const interval = setInterval(getTokenBalances, SUB_TOKEN_REFRESH_BALANCE_INTERVAL);

  return () => {
    clearInterval(interval);
  };
}

async function getEVMBalance (addresses: string[], web3Api: _EvmApi): Promise<string[]> {
  return await Promise.all(addresses.map(async (address) => {
    try {
      return await web3Api.api.eth.getBalance(address);
    } catch (e) {
      return '0';
    }
  }));
}

export function subscribeEVMBalance (params: SubscribeEvmPalletBalance) {
  const { addresses, assetMap, callback, chainInfo, evmApi } = params;
  const chain = chainInfo.slug;
  const nativeTokenInfo = filterAssetsByChainAndType(assetMap, chain, [_AssetType.NATIVE]);
  const nativeTokenSlug = Object.values(nativeTokenInfo)[0]?.slug || '';

  function getBalance () {
    getEVMBalance(addresses, evmApi)
      .then((balances) => {
        return balances.map((balance, index): BalanceItem => {
          return {
            address: addresses[index],
            tokenSlug: nativeTokenSlug,
            state: APIItemState.READY,
            free: (new BN(balance || '0')).toString(),
            locked: '0'
          };
        });
      })
      .catch((e) => {
        console.error(`Error on get native balance with token ${nativeTokenSlug}`, e);

        return addresses.map((address): BalanceItem => {
          return {
            address: address,
            tokenSlug: nativeTokenSlug,
            state: APIItemState.READY,
            free: '0',
            locked: '0'
          };
        });
      })
      .then((items) => {
        callback(items);
      })
      .catch(console.error)
    ;
  }

  getBalance();
  const interval = setInterval(getBalance, ASTAR_REFRESH_BALANCE_INTERVAL);
  const unsub2 = subscribeERC20Interval(params);

  return () => {
    clearInterval(interval);
    unsub2 && unsub2();
  };
}
