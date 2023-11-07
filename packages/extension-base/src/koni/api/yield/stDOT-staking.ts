// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import {
  ExtrinsicType,
  OptimalYieldPath,
  OptimalYieldPathParams,
  RequestYieldStepSubmit, SubmitYieldStepData,
  YieldPoolInfo,
  YieldPositionInfo,
  YieldPositionStats,
  YieldStepType
} from '@subwallet/extension-base/background/KoniTypes';
import { getERC20Contract } from '@subwallet/extension-base/koni/api/tokens/evm/web3';
import { DEFAULT_YIELD_FIRST_STEP, getStellaswapLiquidStakingContract, YIELD_POOL_STAT_REFRESH_INTERVAL } from '@subwallet/extension-base/koni/api/yield/helper/utils';
import { _EvmApi, _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getContractAddressOfToken } from '@subwallet/extension-base/services/chain-service/utils';
import { BalanceService } from '@subwallet/extension-base/services/balance-service';
import { HandleYieldStepData } from '@subwallet/extension-base/koni/api/yield/index';
import { TransactionConfig } from 'web3-core';

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

export async function generatePathForStellaswapLiquidStaking (params: OptimalYieldPathParams) {
  const result: OptimalYieldPath = {
    totalFee: [{ slug: '' }],
    steps: [DEFAULT_YIELD_FIRST_STEP]
  };

  const derivativeTokenSlug = params.poolInfo.derivativeAssets?.[0] || '';
  const derivativeTokenInfo = params.assetInfoMap[derivativeTokenSlug];

  const inputTokenSlug = params.poolInfo.inputAssets[0];
  const inputTokenInfo = params.assetInfoMap[inputTokenSlug];

  try {
    const inputTokenContract = getERC20Contract(params.poolInfo.chain, _getContractAddressOfToken(inputTokenInfo), params.evmApiMap);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
    const allowanceCall = inputTokenContract.methods.allowance(params.address, _getContractAddressOfToken(derivativeTokenInfo));
    const evmApi = params.evmApiMap[params.poolInfo.chain];

    const [allowance, gasPrice] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      (await allowanceCall.call()) as string,
      evmApi.api.eth.getGasPrice()
    ]);

    if (!allowance || parseInt(allowance) <= 0) {
      result.steps.push({
        id: result.steps.length,
        name: 'Authorize token approval',
        type: YieldStepType.TOKEN_APPROVAL
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      const estimatedGas = (await allowanceCall.estimateGas()) as number;

      result.totalFee.push({
        slug: params.poolInfo.feeAssets[0],
        amount: (estimatedGas * parseInt(gasPrice)).toString()
      });
    }

    const stakingContract = getStellaswapLiquidStakingContract(params.poolInfo.chain, _getContractAddressOfToken(derivativeTokenInfo), params.evmApiMap);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
    const depositCall = stakingContract.methods.deposit(params.amount);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    const estimatedDepositGas = (await depositCall.estimateGas()) as number;

    result.steps.push({
      id: result.steps.length,
      name: 'Mint stDOT',
      type: YieldStepType.MINT_STDOT
    });

    result.totalFee.push({
      slug: params.poolInfo.feeAssets[0],
      amount: (estimatedDepositGas * parseInt(gasPrice)).toString()
    });

    return result;
  } catch (e) {
    result.steps.push({
      id: result.steps.length,
      name: 'Mint stDOT',
      type: YieldStepType.MINT_STDOT
    });

    result.totalFee.push({
      slug: params.poolInfo.feeAssets[0],
      amount: '0'
    });

    return result;
  }
}

export async function getStellaswapLiquidStakingExtrinsic (address: string, params: OptimalYieldPathParams, path: OptimalYieldPath, currentStep: number, requestData: RequestYieldStepSubmit, balanceService: BalanceService): Promise<HandleYieldStepData> {
  const inputData = requestData.data as SubmitYieldStepData;
  const evmApi = params.evmApiMap[params.poolInfo.slug];

  const derivativeTokenSlug = params.poolInfo.derivativeAssets?.[0] || '';
  const derivativeTokenInfo = params.assetInfoMap[derivativeTokenSlug];

  const inputTokenSlug = params.poolInfo.inputAssets[0];
  const inputTokenInfo = params.assetInfoMap[inputTokenSlug];

  const gasPrice = await evmApi.api.eth.getGasPrice();

  if (path.steps[currentStep].type === YieldStepType.TOKEN_APPROVAL) {
    const inputTokenContract = getERC20Contract(params.poolInfo.chain, _getContractAddressOfToken(inputTokenInfo), params.evmApiMap);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
    const approveCall = inputTokenContract.methods.approve(address, '115792089237316195423570985008687907853269984665640564039457584007913129639935');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
    const approveEncodedCall = approveCall.encodeABI() as string;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    const estimatedGas = (await approveCall.estimateGas()) as number;

    const transactionObject = {
      gasPrice: gasPrice,
      gas: estimatedGas,
      from: address,
      to: _getContractAddressOfToken(inputTokenInfo),
      data: approveEncodedCall
    } as TransactionConfig;

    return {
      txChain: params.poolInfo.chain,
      extrinsicType: ExtrinsicType.APPROVE_CONTRACT,
      extrinsic: transactionObject,
      txData: requestData,
      transferNativeAmount: '0'
    };
  }

  const stakingContract = getStellaswapLiquidStakingContract(params.poolInfo.chain, _getContractAddressOfToken(derivativeTokenInfo), params.evmApiMap);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
  const depositCall = stakingContract.methods.deposit(params.amount);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
  const estimatedDepositGas = (await depositCall.estimateGas()) as number;


}
