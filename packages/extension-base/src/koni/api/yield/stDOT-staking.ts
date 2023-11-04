// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { YieldPoolInfo, YieldPositionInfo, YieldPositionStats } from '@subwallet/extension-base/background/KoniTypes';
import { getERC20Contract } from '@subwallet/extension-base/koni/api/tokens/evm/web3';
import { YIELD_POOL_STAT_REFRESH_INTERVAL } from '@subwallet/extension-base/koni/api/yield/helper/utils';
import { _EvmApi, _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getContractAddressOfToken } from '@subwallet/extension-base/services/chain-service/utils';

export function subscribeStellaswapLiquidStakingStats (chainApi: _SubstrateApi, chainInfoMap: Record<string, _ChainInfo>, poolInfo: YieldPoolInfo, callback: (rs: YieldPoolInfo) => void) {
  function getPoolStat () {
    // eslint-disable-next-line node/no-callback-literal
    callback({
      ...poolInfo,
      stats: {
        assetEarning: [
          {
            slug: poolInfo.rewardAssets[0],
            apr: 18.4,
            exchangeRate: 1 / 0.997
          }
        ],
        maxCandidatePerFarmer: 1,
        maxWithdrawalRequestPerFarmer: 1,
        minJoinPool: '10000000000',
        minWithdrawal: '0',
        totalApr: 18.4,
        tvl: '0'
      }
    });
  }

  function getStatInterval () {
    getPoolStat();
  }

  getStatInterval();

  const interval = setInterval(getStatInterval, YIELD_POOL_STAT_REFRESH_INTERVAL);

  return () => {
    clearInterval(interval);
  };
}

export function getStellaswapLiquidStakingPosition (evmApiMap: Record<string, _EvmApi>, useAddresses: string[], poolInfo: YieldPoolInfo, assetInfoMap: Record<string, _ChainAsset>, positionCallback: (rs: YieldPositionInfo) => void) {
  const derivativeTokenSlug = poolInfo.derivativeAssets?.[0] || '';
  const derivativeTokenInfo = assetInfoMap[derivativeTokenSlug];
  const contract = getERC20Contract(poolInfo.chain, _getContractAddressOfToken(derivativeTokenInfo), evmApiMap);

  function getTokenBalance () {
    useAddresses.map(async (address) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      const balance = (await contract.methods.balanceOf(address).call()) as string;

      positionCallback({
        slug: poolInfo.slug,
        chain: poolInfo.chain,
        address,
        balance: [
          {
            slug: derivativeTokenSlug, // token slug
            totalBalance: balance,
            activeBalance: balance
          }
        ],

        metadata: {
          rewards: []
        } as YieldPositionStats
      } as YieldPositionInfo);
    });
  }

  getTokenBalance();

  const interval = setInterval(getTokenBalance, YIELD_POOL_STAT_REFRESH_INTERVAL);

  return () => {
    clearInterval(interval);
  };
}
