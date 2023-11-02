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
import { sumBN } from '@subwallet/extension-base/utils';
import { Contract } from 'web3-eth-contract';

import { BN } from '@polkadot/util';

export function subscribeERC20Interval (addresses: string[], chain: string, evmApiMap: Record<string, _EvmApi>, callBack: (result: BalanceItem) => void): () => void {
  let tokenList = {} as Record<string, _ChainAsset>;
  const erc20ContractMap = {} as Record<string, Contract>;

  const getTokenBalances = () => {
    Object.values(tokenList).map(async (tokenInfo) => {
      let free = new BN(0);

      try {
        const contract = erc20ContractMap[tokenInfo.slug];
        const balanceList = await Promise.all(addresses.map((address): Promise<string> => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
          return contract.methods.balanceOf(address).call();
        }));

        free = sumBN(balanceList.map((balance) => new BN(balance || 0)));

        callBack({
          tokenSlug: tokenInfo.slug,
          free: free.toString(),
          locked: '0',
          state: APIItemState.READY
        } as BalanceItem);
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

export function subscribeEVMBalance (chain: string, addresses: string[], evmApiMap: Record<string, _EvmApi>, callback: (rs: BalanceItem) => void, tokenInfo: _ChainAsset) {
  const balanceItem = {
    tokenSlug: tokenInfo.slug,
    state: APIItemState.PENDING,
    free: '0',
    locked: '0'
  } as BalanceItem;

  function getBalance () {
    getEVMBalance(chain, addresses, evmApiMap)
      .then((balances) => {
        balanceItem.free = sumBN(balances.map((b) => (new BN(b || '0')))).toString();
        balanceItem.state = APIItemState.READY;
        callback(balanceItem);
      })
      .catch(console.warn);
  }

  getBalance();
  const interval = setInterval(getBalance, ASTAR_REFRESH_BALANCE_INTERVAL);
  const unsub2 = subscribeERC20Interval(addresses, chain, evmApiMap, callback);

  return () => {
    clearInterval(interval);
    unsub2 && unsub2();
  };
}
