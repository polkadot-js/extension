// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { ExtrinsicType, NominatorMetadata, OptimalYieldPath, OptimalYieldPathParams, RequestYieldStepSubmit, StakingStatus, StakingType, TokenApproveData, UnbondingSubmitParams, UnstakingInfo, UnstakingStatus, YieldPoolInfo, YieldPoolType, YieldPositionInfo, YieldStepType } from '@subwallet/extension-base/background/KoniTypes';
import { getERC20Contract } from '@subwallet/extension-base/koni/api/tokens/evm/web3';
import { DEFAULT_YIELD_FIRST_STEP, getStellaswapLiquidStakingContract, YIELD_POOL_STAT_REFRESH_INTERVAL } from '@subwallet/extension-base/koni/api/yield/helper/utils';
import { HandleYieldStepData } from '@subwallet/extension-base/koni/api/yield/index';
import { _EvmApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getAssetDecimals, _getContractAddressOfToken } from '@subwallet/extension-base/services/chain-service/utils';
import { recalculateGasPrice } from '@subwallet/extension-base/utils/eth';
import fetch from 'cross-fetch';
import { TransactionConfig } from 'web3-core';

const APR_STATS_URL = 'https://apr-api.stellaswap.com/api/v1/stdot';

interface StellaswapApr {
  code: number,
  result: number,
  isSuccess: boolean
}

interface StellaswapUnbonding {
  unbonded: string,
  waiting: string
}

const MAX_INT = '115792089237316195423570985008687907853269984665640564039457584007913129639935';

export function subscribeStellaswapLiquidStakingStats (chainInfoMap: Record<string, _ChainInfo>, assetInfoMap: Record<string, _ChainAsset>, evmApiMap: Record<string, _EvmApi>, poolInfo: YieldPoolInfo, callback: (rs: YieldPoolInfo) => void) {
  const derivativeTokenSlug = poolInfo.derivativeAssets?.[0] || '';
  const derivativeTokenInfo = assetInfoMap[derivativeTokenSlug];

  const stakingContract = getStellaswapLiquidStakingContract(poolInfo.chain, _getContractAddressOfToken(derivativeTokenInfo), evmApiMap);

  async function getPoolStat () {
    const aprPromise = new Promise(function (resolve) {
      fetch(APR_STATS_URL, {
        method: 'GET'
      }).then((res) => {
        resolve(res.json());
      }).catch(console.error);
    });

    const sampleTokenShare = 10 ** _getAssetDecimals(derivativeTokenInfo);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
    const tvlCall = stakingContract.methods.fundRaisedBalance();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
    const exchangeRateCall = stakingContract.methods.getPooledTokenByShares(sampleTokenShare);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const [aprObject, tvl, equivalentTokenShare] = await Promise.all([
      aprPromise,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
      tvlCall.call(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
      exchangeRateCall.call()
    ]);

    const exchangeRate = (equivalentTokenShare as number) / (10 ** _getAssetDecimals(derivativeTokenInfo));

    // eslint-disable-next-line node/no-callback-literal
    callback({
      ...poolInfo,
      stats: {
        assetEarning: [
          {
            slug: poolInfo.rewardAssets[0],
            apr: (aprObject as StellaswapApr).result,
            exchangeRate: exchangeRate
          }
        ],
        maxCandidatePerFarmer: 1,
        maxWithdrawalRequestPerFarmer: 1,
        minJoinPool: '0',
        minWithdrawal: '0',
        totalApr: (aprObject as StellaswapApr).result,
        tvl: (tvl as number).toString()
      }
    });
  }

  function getStatInterval () {
    getPoolStat().catch(console.error);
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
  const contract = getStellaswapLiquidStakingContract(poolInfo.chain, _getContractAddressOfToken(derivativeTokenInfo), evmApiMap);

  function getTokenBalance () {
    useAddresses.map(async (address) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      const balance = (await contract.methods.balanceOf(address).call()) as string;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      const unbondedObject = (await contract.methods.getUnbonded(address).call()) as StellaswapUnbonding;
      const unstakings: UnstakingInfo[] = [];

      if (parseInt(unbondedObject.unbonded) > 0) {
        unstakings.push({
          chain: poolInfo.chain,
          claimable: unbondedObject.unbonded,
          status: UnstakingStatus.CLAIMABLE,
          waitingTime: 0
        });
      }

      if (parseInt(unbondedObject.waiting) > 0) {
        unstakings.push({
          chain: poolInfo.chain,
          claimable: unbondedObject.waiting,
          status: UnstakingStatus.UNLOCKING
        });
      }

      positionCallback({
        slug: poolInfo.slug,
        chain: poolInfo.chain,
        type: YieldPoolType.LIQUID_STAKING,
        address,
        balance: [
          {
            slug: derivativeTokenSlug, // token slug
            activeBalance: balance
          }
        ],

        metadata: {
          chain: poolInfo.chain,
          type: StakingType.LIQUID_STAKING,

          status: StakingStatus.EARNING_REWARD,
          address,
          activeStake: balance,
          nominations: [],
          unstakings
        } as NominatorMetadata
      } as YieldPositionInfo);
    });
  }

  getTokenBalance();

  const interval = setInterval(getTokenBalance, 30000);

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
    const allowanceCall = inputTokenContract.methods.allowance(params.address, _getContractAddressOfToken(derivativeTokenInfo)); // TODO
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

export async function getStellaswapLiquidStakingExtrinsic (address: string, params: OptimalYieldPathParams, path: OptimalYieldPath, currentStep: number, requestData: RequestYieldStepSubmit): Promise<HandleYieldStepData> {
  const derivativeTokenSlug = params.poolInfo.derivativeAssets?.[0] || '';
  const derivativeTokenInfo = params.assetInfoMap[derivativeTokenSlug];
  const inputTokenSlug = params.poolInfo.inputAssets[0];
  const inputTokenInfo = params.assetInfoMap[inputTokenSlug];
  const chain = params.poolInfo.chain;
  const evmApi = params.evmApiMap[params.poolInfo.chain];

  if (path.steps[currentStep].type === YieldStepType.TOKEN_APPROVAL) {
    const inputTokenContract = getERC20Contract(chain, _getContractAddressOfToken(inputTokenInfo), params.evmApiMap);
    const spenderAddress = _getContractAddressOfToken(derivativeTokenInfo);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
    const approveCall = inputTokenContract.methods.approve(spenderAddress, MAX_INT);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
    const approveEncodedCall = approveCall.encodeABI() as string;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    const gasLimit = await approveCall.estimateGas({ from: address }) as number;
    const _price = await evmApi.api.eth.getGasPrice();
    const gasPrice = recalculateGasPrice(_price, chain);
    const transactionObject = {
      from: address,
      to: _getContractAddressOfToken(inputTokenInfo),
      data: approveEncodedCall,
      gasPrice: gasPrice,
      gas: gasLimit
    } as TransactionConfig;

    const _data: TokenApproveData = {
      inputTokenSlug: inputTokenSlug,
      spenderTokenSlug: derivativeTokenSlug
    };

    return {
      txChain: params.poolInfo.chain,
      extrinsicType: ExtrinsicType.TOKEN_APPROVE,
      extrinsic: transactionObject,
      txData: _data,
      transferNativeAmount: '0'
    };
  }

  const stakingContract = getStellaswapLiquidStakingContract(chain, _getContractAddressOfToken(derivativeTokenInfo), params.evmApiMap);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
  const depositCall = stakingContract.methods.deposit(params.amount); // TODO: referral

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
  const depositEncodedCall = depositCall.encodeABI() as string;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
  const gasLimit = await depositCall.estimateGas({ from: address }) as number;
  const _price = await evmApi.api.eth.getGasPrice();
  const gasPrice = recalculateGasPrice(_price, chain);

  const transactionObject = {
    from: address,
    to: _getContractAddressOfToken(derivativeTokenInfo),
    data: depositEncodedCall,
    gasPrice: gasPrice,
    gas: gasLimit
  } as TransactionConfig;

  return {
    txChain: params.poolInfo.chain,
    extrinsicType: ExtrinsicType.MINT_STDOT,
    extrinsic: transactionObject,
    txData: requestData,
    transferNativeAmount: '0'
  };
}

export async function getStellaswapLiquidStakingDefaultUnstake (params: UnbondingSubmitParams, evmApiMap: Record<string, _EvmApi>, poolInfo: YieldPoolInfo, assetInfoMap: Record<string, _ChainAsset>): Promise<TransactionConfig> {
  const derivativeTokenSlug = poolInfo.derivativeAssets?.[0] || '';
  const derivativeTokenInfo = assetInfoMap[derivativeTokenSlug];
  const address = params.nominatorMetadata.address;
  const evmApi = evmApiMap[poolInfo.chain];

  const stakingContract = getStellaswapLiquidStakingContract(poolInfo.chain, _getContractAddressOfToken(derivativeTokenInfo), evmApiMap);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
  const redeemCall = stakingContract.methods.redeem(params.amount);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
  const redeemEncodedCall = redeemCall.encodeABI() as string;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
  const gasLimit = await redeemCall.estimateGas({ from: address }) as number;
  const _price = await evmApi.api.eth.getGasPrice();
  const gasPrice = recalculateGasPrice(_price, poolInfo.chain);

  return {
    from: params.nominatorMetadata.address,
    to: _getContractAddressOfToken(derivativeTokenInfo),
    data: redeemEncodedCall,
    gasPrice: gasPrice,
    gas: gasLimit
  } as TransactionConfig;
}

export async function getStellaswapLiquidStakingDefaultWithdraw (poolInfo: YieldPoolInfo, evmApiMap: Record<string, _EvmApi>, nominatorMetadata: NominatorMetadata, assetInfoMap: Record<string, _ChainAsset>) {
  const derivativeTokenSlug = poolInfo.derivativeAssets?.[0] || '';
  const derivativeTokenInfo = assetInfoMap[derivativeTokenSlug];
  const address = nominatorMetadata.address;
  const evmApi = evmApiMap[poolInfo.chain];

  const stakingContract = getStellaswapLiquidStakingContract(poolInfo.chain, _getContractAddressOfToken(derivativeTokenInfo), evmApiMap);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
  const claimUnbondedCall = stakingContract.methods.claimUnbonded();

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
  const claimUnbondedEncodedCall = claimUnbondedCall.encodeABI() as string;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
  const gasLimit = await claimUnbondedCall.estimateGas({ from: address }) as number;
  const _price = await evmApi.api.eth.getGasPrice();
  const gasPrice = recalculateGasPrice(_price, poolInfo.chain);

  return {
    from: nominatorMetadata.address,
    to: _getContractAddressOfToken(derivativeTokenInfo),
    data: claimUnbondedEncodedCall,
    gasPrice: gasPrice,
    gas: gasLimit
  } as TransactionConfig;
}
