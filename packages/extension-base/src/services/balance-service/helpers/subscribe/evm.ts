// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _AssetType, _ChainAsset } from '@subwallet/chain-list/types';
import { APIItemState, BalanceItem } from '@subwallet/extension-base/background/KoniTypes';
import { ASTAR_REFRESH_BALANCE_INTERVAL, SUB_TOKEN_REFRESH_BALANCE_INTERVAL } from '@subwallet/extension-base/constants';
import { getEVMBalance } from '@subwallet/extension-base/koni/api/tokens/evm/balance';
import { getERC20Contract } from '@subwallet/extension-base/koni/api/tokens/evm/web3';
import { state } from '@subwallet/extension-base/koni/background/handlers';
import { _EvmApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getContractAddressOfToken } from '@subwallet/extension-base/services/chain-service/utils';
import { Contract } from 'web3-eth-contract';

import { BN } from '@polkadot/util';

export function subscribeERC20Interval (addresses: string[], chain: string, evmApiMap: Record<string, _EvmApi>, callBack: (result: BalanceItem[]) => void): () => void {
  let tokenList = {} as Record<string, _ChainAsset>;
  const erc20ContractMap = {} as Record<string, Contract>;

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

        callBack(items);
      } catch (err) {
        console.log(tokenInfo.slug, err);
      }
    });
  };

  tokenList = state.getAssetByChainAndAsset(chain, [_AssetType.ERC20]);

  Object.entries(tokenList).forEach(([slug, tokenInfo]) => {
    erc20ContractMap[slug] = getERC20Contract(chain, _getContractAddressOfToken(tokenInfo), evmApiMap);
  });

  getTokenBalances();

  const interval = setInterval(getTokenBalances, SUB_TOKEN_REFRESH_BALANCE_INTERVAL);

  return () => {
    clearInterval(interval);
  };
}

export function subscribeEVMBalance (chain: string, addresses: string[], evmApiMap: Record<string, _EvmApi>, callback: (rs: BalanceItem[]) => void, tokenInfo: _ChainAsset) {
  function getBalance () {
    getEVMBalance(chain, addresses, evmApiMap)
      .then((balances) => {
        return balances.map((balance, index): BalanceItem => {
          return {
            address: addresses[index],
            tokenSlug: tokenInfo.slug,
            state: APIItemState.READY,
            free: (new BN(balance || '0')).toString(),
            locked: '0'
          };
        });
      })
      .catch((e) => {
        console.error(`Error on get native balance with token ${tokenInfo.slug}`, e);

        return addresses.map((address): BalanceItem => {
          return {
            address: address,
            tokenSlug: tokenInfo.slug,
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
  const unsub2 = subscribeERC20Interval(addresses, chain, evmApiMap, callback);

  return () => {
    clearInterval(interval);
    unsub2 && unsub2();
  };
}
