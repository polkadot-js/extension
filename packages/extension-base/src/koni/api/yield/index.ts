// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { BasicTxErrorType, ChainStakingMetadata, ExtrinsicType, NominatorMetadata, OptimalYieldPath, OptimalYieldPathParams, RequestBondingSubmit, RequestStakePoolingBonding, RequestYieldStepSubmit, StakingType, UnbondingSubmitParams, YieldAssetExpectedEarning, YieldCompoundingPeriod, YieldPoolInfo, YieldPositionInfo, YieldProcessValidation, YieldStepType, YieldValidationStatus } from '@subwallet/extension-base/background/KoniTypes';
import { validatePoolBondingCondition, validateRelayBondingCondition } from '@subwallet/extension-base/koni/api/staking/bonding/relayChain';
import { createXcmExtrinsic } from '@subwallet/extension-base/koni/api/xcm';
import { getAcalaLiquidStakingDefaultUnstake, getAcalaLiquidStakingDefaultWithdraw, getAcalaLiquidStakingExtrinsic, getAcalaLiquidStakingPosition, getAcalaLiquidStakingRedeem, subscribeAcalaLcDOTLiquidStakingStats, subscribeAcalaLiquidStakingStats } from '@subwallet/extension-base/koni/api/yield/acala-liquid-staking';
import { getBifrostLiquidStakingDefaultUnstake, getBifrostLiquidStakingExtrinsic, getBifrostLiquidStakingPosition, getBifrostLiquidStakingRedeem, subscribeBifrostLiquidStakingStats } from '@subwallet/extension-base/koni/api/yield/bifrost-liquid-staking';
import { YIELD_POOLS_INFO } from '@subwallet/extension-base/koni/api/yield/data';
import { DEFAULT_YIELD_FIRST_STEP, fakeAddress, RuntimeDispatchInfo } from '@subwallet/extension-base/koni/api/yield/helper/utils';
import { getInterlayLendingExtrinsic, getInterlayLendingPosition, getInterlayLendingRedeem, subscribeInterlayLendingStats } from '@subwallet/extension-base/koni/api/yield/interlay-lending';
import { subscribeMoonwellLendingStats } from '@subwallet/extension-base/koni/api/yield/moonwell-lending';
import { generatePathForNativeStaking, getNativeStakingBondExtrinsic, getNativeStakingPosition, getNominationPoolJoinExtrinsic, getNominationPoolPosition, subscribeNativeStakingYieldStats } from '@subwallet/extension-base/koni/api/yield/native-staking';
import { getParallelLiquidStakingDefaultUnstake, getParallelLiquidStakingDefaultWithdraw, getParallelLiquidStakingExtrinsic, getParallelLiquidStakingPosition, getParallelLiquidStakingRedeem, subscribeParallelLiquidStakingStats } from '@subwallet/extension-base/koni/api/yield/parallel-liquid-staking';
import { generatePathForStellaswapLiquidStaking, getStellaswapLiquidStakingDefaultUnstake, getStellaswapLiquidStakingDefaultWithdraw, getStellaswapLiquidStakingExtrinsic, getStellaswapLiquidStakingPosition, subscribeStellaswapLiquidStakingStats } from '@subwallet/extension-base/koni/api/yield/stDOT-staking';
import { BalanceService } from '@subwallet/extension-base/services/balance-service';
import { SubstrateApi } from '@subwallet/extension-base/services/chain-service/handler/SubstrateApi';
import { _EvmApi, _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getTokenOnChainInfo, _isChainEvmCompatible } from '@subwallet/extension-base/services/chain-service/utils';
import { HandleYieldStepData, SubmitJoinNativeStaking, SubmitJoinNominationPool, SubmitYieldStepData, YieldPoolType } from '@subwallet/extension-base/types';
import { categoryAddresses } from '@subwallet/extension-base/utils';
import { TransactionConfig } from 'web3-core';

import { SubmittableExtrinsic } from '@polkadot/api/types';
import { BN, BN_ZERO } from '@polkadot/util';

// only apply for DOT right now, will need to scale up
export function subscribeYieldPoolStats (substrateApiMap: Record<string, _SubstrateApi>, evmApiMap: Record<string, _EvmApi>, chainInfoMap: Record<string, _ChainInfo>, assetInfoMap: Record<string, _ChainAsset>, callback: (rs: YieldPoolInfo) => void) {
  const unsubList: VoidFunction[] = [];

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  Object.values(YIELD_POOLS_INFO).forEach(async (poolInfo) => {
    if (substrateApiMap[poolInfo.chain] || evmApiMap[poolInfo.chain]) {
      const chainInfo = chainInfoMap[poolInfo.chain];

      if (!_isChainEvmCompatible(chainInfo)) {
        const substrateApi = await substrateApiMap[poolInfo.chain].isReady;

        if (YieldPoolType.NOMINATION_POOL === poolInfo.type) {
          const unsub = await subscribeNativeStakingYieldStats(poolInfo, substrateApi, chainInfo, callback);

          // @ts-ignore
          unsubList.push(unsub);
        } else if (poolInfo.slug === 'DOT___bifrost_liquid_staking') {
          const unsub = subscribeBifrostLiquidStakingStats(poolInfo, assetInfoMap, callback);

          // @ts-ignore
          unsubList.push(unsub);
        } else if (poolInfo.slug === 'DOT___acala_liquid_staking') {
          const unsub = subscribeAcalaLiquidStakingStats(substrateApi, chainInfoMap, poolInfo, callback);

          unsubList.push(unsub);
        } else if (poolInfo.slug === 'DOT___interlay_lending') {
          const unsub = subscribeInterlayLendingStats(substrateApi, chainInfoMap, poolInfo, assetInfoMap, callback);

          unsubList.push(unsub);
        } else if (poolInfo.slug === 'DOT___parallel_liquid_staking') {
          const unsub = subscribeParallelLiquidStakingStats(substrateApi, poolInfo, callback);

          unsubList.push(unsub);
        } else if (poolInfo.slug === 'LcDOT___acala_euphrates_liquid_staking') {
          const unsub = subscribeAcalaLcDOTLiquidStakingStats(substrateApi, chainInfoMap, poolInfo, callback);

          unsubList.push(unsub);
        } else if (poolInfo.slug === 'xcDOT___moonwell_lending') {
          const unsub = subscribeMoonwellLendingStats(substrateApi, chainInfoMap, poolInfo, callback);

          unsubList.push(unsub);
        }
      } else {
        if (poolInfo.slug === 'xcDOT___stellaswap_liquid_staking') {
          const unsub = subscribeStellaswapLiquidStakingStats(chainInfoMap, assetInfoMap, evmApiMap, poolInfo, callback);

          unsubList.push(unsub);
        }
      }
    }
  });

  return () => {
    unsubList.forEach((unsub) => {
      unsub && unsub();
    });
  };
}

export function subscribeYieldPosition (substrateApiMap: Record<string, SubstrateApi>, evmApiMap: Record<string, _EvmApi>, addresses: string[], chainInfoMap: Record<string, _ChainInfo>, assetInfoMap: Record<string, _ChainAsset>, callback: (rs: YieldPositionInfo) => void) {
  const unsubList: VoidFunction[] = [];
  const [substrateAddresses, evmAddresses] = categoryAddresses(addresses);

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  Object.values(YIELD_POOLS_INFO).forEach(async (poolInfo) => {
    const chainInfo = chainInfoMap[poolInfo.chain];

    if (_isChainEvmCompatible(chainInfo) && !evmApiMap[poolInfo.chain]) {
      return;
    } else if (!substrateApiMap[poolInfo.chain]) {
      return;
    }

    const substrateApi = await substrateApiMap[poolInfo.chain].isReady;

    const useAddresses = _isChainEvmCompatible(chainInfo) ? evmAddresses : substrateAddresses;

    if (poolInfo.type === YieldPoolType.NATIVE_STAKING) {
      const unsub = await getNativeStakingPosition(substrateApi, useAddresses, chainInfo, poolInfo, callback);

      unsubList.push(unsub);
    } else if (poolInfo.type === YieldPoolType.NOMINATION_POOL) {
      const unsub = await getNominationPoolPosition(substrateApi, useAddresses, chainInfo, poolInfo, callback);

      unsubList.push(unsub);
    } else if (poolInfo.slug === 'DOT___bifrost_liquid_staking') {
      const unsub = await getBifrostLiquidStakingPosition(substrateApi, useAddresses, chainInfo, poolInfo, assetInfoMap, callback);

      unsubList.push(unsub);
    } else if (poolInfo.slug === 'DOT___acala_liquid_staking') {
      const unsub = await getAcalaLiquidStakingPosition(substrateApi, useAddresses, chainInfo, poolInfo, assetInfoMap, callback);

      unsubList.push(unsub);
    } else if (poolInfo.slug === 'DOT___interlay_lending') {
      const unsub = await getInterlayLendingPosition(substrateApi, useAddresses, chainInfo, poolInfo, assetInfoMap, callback);

      unsubList.push(unsub);
    } else if (poolInfo.slug === 'DOT___parallel_liquid_staking') {
      const unsub = await getParallelLiquidStakingPosition(substrateApi, useAddresses, chainInfo, poolInfo, assetInfoMap, callback);

      unsubList.push(unsub);
    } else if (poolInfo.slug === 'xcDOT___stellaswap_liquid_staking') {
      const unsub = getStellaswapLiquidStakingPosition(evmApiMap, useAddresses, poolInfo, assetInfoMap, callback);

      unsubList.push(unsub);
    }
  });

  return () => {
    unsubList.forEach((unsub) => {
      unsub && unsub();
    });
  };
}

export function calculateReward (apr: number, amount = 0, compoundingPeriod = YieldCompoundingPeriod.YEARLY, isApy = false): YieldAssetExpectedEarning {
  if (!apr) {
    return {};
  }

  if (!isApy) {
    const periodApr = apr / 365 * compoundingPeriod; // APR is always annually
    const earningRatio = (periodApr / 100) / compoundingPeriod;

    const periodApy = (1 + earningRatio) ** compoundingPeriod - 1;

    const reward = periodApy * amount;

    return {
      apy: periodApy * 100,
      rewardInToken: reward
    };
  } else {
    const reward = (apr / 100) * amount;

    return {
      apy: apr,
      rewardInToken: reward * (compoundingPeriod / YieldCompoundingPeriod.YEARLY)
    };
  }
}

export async function generateNaiveOptimalPath (params: OptimalYieldPathParams, balanceService: BalanceService): Promise<OptimalYieldPath> {
  // 1. assume inputs are already validated
  // 2. generate paths based on amount only, not taking fee into account
  // 3. fees are calculated in the worst possible situation
  // 4. fees are calculated for the whole process, either user can pay all or nothing

  if (params.poolInfo.slug === 'DOT___bifrost_liquid_staking') {
    return generatePathForLiquidStaking(params, balanceService);
  } else if (params.poolInfo.slug === 'DOT___acala_liquid_staking') {
    return generatePathForLiquidStaking(params, balanceService);
  } else if (params.poolInfo.slug === 'DOT___interlay_lending') {
    return generatePathForLiquidStaking(params, balanceService);
  } else if (params.poolInfo.slug === 'DOT___parallel_liquid_staking') {
    return generatePathForLiquidStaking(params, balanceService);
  } else if (params.poolInfo.slug === 'xcDOT___stellaswap_liquid_staking') {
    return await generatePathForStellaswapLiquidStaking(params);
  }

  return generatePathForNativeStaking(params);
}

export async function generatePathForLiquidStaking (params: OptimalYieldPathParams, balanceService: BalanceService): Promise<OptimalYieldPath> {
  const bnAmount = new BN(params.amount);
  const result: OptimalYieldPath = {
    totalFee: [{ slug: '' }],
    steps: [DEFAULT_YIELD_FIRST_STEP]
  };

  try {
    const poolOriginSubstrateApi = await params.substrateApiMap[params.poolInfo.chain].isReady;

    const inputTokenSlug = params.poolInfo.inputAssets[0]; // assume that the pool only has 1 input token, will update later
    const inputTokenInfo = params.assetInfoMap[inputTokenSlug];

    const altInputTokenSlug = params.poolInfo.altInputAssets ? params.poolInfo?.altInputAssets[0] : '';
    const altInputTokenInfo = params.assetInfoMap[altInputTokenSlug];

    const [inputTokenBalance, altInputTokenBalance] = await Promise.all([
      balanceService.getTokenFreeBalance(params.address, inputTokenInfo.originChain, inputTokenSlug),
      balanceService.getTokenFreeBalance(params.address, altInputTokenInfo.originChain, altInputTokenSlug)
    ]);

    const bnInputTokenBalance = new BN(inputTokenBalance.value);
    const defaultFeeTokenSlug = params.poolInfo.feeAssets[0];

    if (!bnInputTokenBalance.gte(bnAmount)) {
      if (params.poolInfo.altInputAssets) {
        const bnAltInputTokenBalance = new BN(altInputTokenBalance.value || '0');

        if (bnAltInputTokenBalance.gt(BN_ZERO)) {
          result.steps.push({
            id: result.steps.length,
            metadata: {
              sendingValue: bnAmount.toString(),
              originTokenInfo: altInputTokenInfo,
              destinationTokenInfo: inputTokenInfo
            },
            name: 'Transfer DOT from Polkadot',
            type: YieldStepType.XCM
          });

          const xcmOriginSubstrateApi = await params.substrateApiMap[altInputTokenInfo.originChain].isReady;

          const xcmTransfer = await createXcmExtrinsic({
            originTokenInfo: altInputTokenInfo,
            destinationTokenInfo: inputTokenInfo,
            sendingValue: bnAmount.toString(),
            recipient: fakeAddress,
            chainInfoMap: params.chainInfoMap,
            substrateApi: xcmOriginSubstrateApi
          });

          const _xcmFeeInfo = await xcmTransfer.paymentInfo(fakeAddress);
          const xcmFeeInfo = _xcmFeeInfo.toPrimitive() as unknown as RuntimeDispatchInfo;
          // TODO: calculate fee for destination chain

          result.totalFee.push({
            slug: altInputTokenSlug,
            amount: (xcmFeeInfo.partialFee * 1.2).toString() // TODO
          });
        }
      }
    }

    let mintFee = '0';

    if (params.poolInfo.slug === 'DOT___bifrost_liquid_staking') {
      result.steps.push({
        id: result.steps.length,
        name: 'Mint vDOT',
        type: YieldStepType.MINT_VDOT
      });

      const _mintFeeInfo = await poolOriginSubstrateApi.api.tx.vtokenMinting.mint(_getTokenOnChainInfo(inputTokenInfo), params.amount, null).paymentInfo(fakeAddress);
      const mintFeeInfo = _mintFeeInfo.toPrimitive() as unknown as RuntimeDispatchInfo;

      mintFee = mintFeeInfo.partialFee.toString();
    } else if (params.poolInfo.slug === 'DOT___acala_liquid_staking') {
      result.steps.push({
        id: result.steps.length,
        name: 'Mint LDOT',
        type: YieldStepType.MINT_LDOT
      });

      const _mintFeeInfo = await poolOriginSubstrateApi.api.tx.homa.mint(params.amount).paymentInfo(fakeAddress);
      const mintFeeInfo = _mintFeeInfo.toPrimitive() as unknown as RuntimeDispatchInfo;

      mintFee = mintFeeInfo.partialFee.toString();
    } else if (params.poolInfo.slug === 'DOT___interlay_lending') {
      result.steps.push({
        id: result.steps.length,
        name: 'Mint qDOT',
        type: YieldStepType.MINT_QDOT
      });

      const _mintFeeInfo = await poolOriginSubstrateApi.api.tx.loans.mint(_getTokenOnChainInfo(inputTokenInfo), params.amount).paymentInfo(fakeAddress);
      const mintFeeInfo = _mintFeeInfo.toPrimitive() as unknown as RuntimeDispatchInfo;

      mintFee = mintFeeInfo.partialFee.toString();
    } else if (params.poolInfo.slug === 'DOT___parallel_liquid_staking') {
      result.steps.push({
        id: result.steps.length,
        name: 'Mint sDOT',
        type: YieldStepType.MINT_SDOT
      });

      const _mintFeeInfo = await poolOriginSubstrateApi.api.tx.liquidStaking.stake(params.amount).paymentInfo(fakeAddress);
      const mintFeeInfo = _mintFeeInfo.toPrimitive() as unknown as RuntimeDispatchInfo;

      mintFee = mintFeeInfo.partialFee.toString();
    }

    result.totalFee.push({
      slug: defaultFeeTokenSlug,
      amount: mintFee
    });

    return result;
  } catch (e) {
    // @ts-ignore
    const errorMessage = e.message as string;

    if (errorMessage.includes('network')) {
      result.connectionError = errorMessage.split(' ')[0];
    }

    if (params.poolInfo.slug === 'DOT___bifrost_liquid_staking') {
      result.steps.push({
        id: result.steps.length,
        name: 'Mint vDOT',
        type: YieldStepType.MINT_VDOT
      });
    } else if (params.poolInfo.slug === 'DOT___acala_liquid_staking') {
      result.steps.push({
        id: result.steps.length,
        name: 'Mint LDOT',
        type: YieldStepType.MINT_LDOT
      });
    } else if (params.poolInfo.slug === 'DOT___interlay_lending') {
      result.steps.push({
        id: result.steps.length,
        name: 'Mint qDOT',
        type: YieldStepType.MINT_QDOT
      });
    } else if (params.poolInfo.slug === 'DOT___parallel_liquid_staking') {
      result.steps.push({
        id: result.steps.length,
        name: 'Mint sDOT',
        type: YieldStepType.MINT_SDOT
      });
    }

    result.totalFee.push({
      slug: params.poolInfo.feeAssets[0],
      amount: '0'
    });

    return result;
  }
}

export async function validateEarningProcess (address: string, params: OptimalYieldPathParams, path: OptimalYieldPath, balanceService: BalanceService): Promise<TransactionError[]> {
  const errors: TransactionError[] = [];
  const processValidation: YieldProcessValidation = {
    ok: true,
    status: YieldValidationStatus.OK
  };

  // xcm
  const bnAmount = new BN(params.amount);
  const inputTokenSlug = params.poolInfo.inputAssets[0];
  const inputTokenInfo = params.assetInfoMap[inputTokenSlug];

  // submit
  const submitStep = path.steps[1].type === YieldStepType.XCM ? path.steps[2] : path.steps[1];
  const defaultFeeTokenSlug = params.poolInfo.feeAssets[0];
  const feeTokenSlug = path.totalFee[submitStep.id].slug;
  const feeTokenInfo = params.assetInfoMap[feeTokenSlug];

  const [feeTokenBalance, inputTokenBalance] = await Promise.all([
    balanceService.getTokenFreeBalance(params.address, feeTokenInfo.originChain, feeTokenSlug),
    balanceService.getTokenFreeBalance(params.address, inputTokenInfo.originChain, inputTokenSlug)
  ]);

  const bnFeeTokenBalance = new BN(feeTokenBalance.value || '0');
  const bnInputTokenBalance = new BN(inputTokenBalance.value || '0');

  const altInputTokenSlug = params.poolInfo?.altInputAssets?.[0];

  let isXcmOk = false;

  if (altInputTokenSlug) {
    const altInputTokenInfo = params.assetInfoMap[altInputTokenSlug];

    if (path.steps[1].type === YieldStepType.XCM && params.poolInfo.altInputAssets) { // if xcm
      const altInputTokenBalance = await balanceService.getTokenFreeBalance(params.address, altInputTokenInfo.originChain, altInputTokenSlug);

      const missingAmount = bnAmount.sub(bnInputTokenBalance); // TODO: what if input token is not LOCAL ??
      const xcmFee = new BN(path.totalFee[1].amount || '0');
      const xcmAmount = missingAmount.add(xcmFee);

      const bnAltInputTokenBalance = new BN(altInputTokenBalance.value || '0');
      const altInputTokenMinAmount = new BN(params.assetInfoMap[altInputTokenSlug].minAmount || '0');

      if (!bnAltInputTokenBalance.sub(xcmAmount).gte(altInputTokenMinAmount)) {
        processValidation.failedStep = path.steps[1];
        processValidation.ok = false;
        processValidation.status = YieldValidationStatus.NOT_ENOUGH_BALANCE;

        errors.push(new TransactionError(YieldValidationStatus.NOT_ENOUGH_BALANCE, processValidation.message, processValidation));

        return errors;
      }

      isXcmOk = true;
    }
  }

  if (params.poolInfo.feeAssets.length === 1 && feeTokenSlug === defaultFeeTokenSlug) {
    const bnFeeAmount = new BN(path.totalFee[submitStep.id]?.amount || '0');
    const bnFeeTokenMinAmount = new BN(params.assetInfoMap[feeTokenSlug]?.minAmount || '0');

    if (!bnFeeTokenBalance.sub(bnFeeAmount).gte(bnFeeTokenMinAmount)) {
      processValidation.failedStep = path.steps[submitStep.id];
      processValidation.ok = false;
      processValidation.status = YieldValidationStatus.NOT_ENOUGH_FEE;

      errors.push(new TransactionError(YieldValidationStatus.NOT_ENOUGH_FEE, processValidation.message, processValidation));

      return errors;
    }
  }

  if (!bnAmount.gte(new BN(params.poolInfo.stats?.minJoinPool || '0'))) {
    processValidation.failedStep = path.steps[submitStep.id];
    processValidation.ok = false;
    processValidation.status = YieldValidationStatus.NOT_ENOUGH_MIN_JOIN_POOL;

    errors.push(new TransactionError(YieldValidationStatus.NOT_ENOUGH_MIN_JOIN_POOL, processValidation.message, processValidation));

    return errors;
  }

  if (!isXcmOk && bnAmount.gt(bnInputTokenBalance)) {
    processValidation.failedStep = path.steps[submitStep.id];
    processValidation.ok = false;
    processValidation.status = YieldValidationStatus.NOT_ENOUGH_BALANCE;

    errors.push(new TransactionError(YieldValidationStatus.NOT_ENOUGH_BALANCE, processValidation.message, processValidation));

    return errors;
  }

  return errors;
}

export async function validateYieldProcess (address: string, params: OptimalYieldPathParams, path: OptimalYieldPath, balanceService: BalanceService, data?: SubmitYieldStepData | SubmitJoinNativeStaking | SubmitJoinNominationPool): Promise<TransactionError[]> {
  const poolInfo = params.poolInfo;
  const chainInfo = params.chainInfoMap[poolInfo.chain];

  if (params.poolInfo.type === YieldPoolType.NOMINATION_POOL) {
    if (!data) {
      return [new TransactionError(BasicTxErrorType.INTERNAL_ERROR)];
    }

    const inputData = data as SubmitJoinNominationPool;

    return validatePoolBondingCondition(chainInfo, inputData.amount, inputData.selectedPool, address, poolInfo.metadata as ChainStakingMetadata, inputData.nominatorMetadata);
  } else if (params.poolInfo.type === YieldPoolType.NATIVE_STAKING) {
    if (!data) {
      return [new TransactionError(BasicTxErrorType.INTERNAL_ERROR)];
    }

    const inputData = data as SubmitJoinNativeStaking;

    return validateRelayBondingCondition(chainInfo, inputData.amount, inputData.selectedValidators, address, poolInfo.metadata as ChainStakingMetadata, inputData.nominatorMetadata);
  }

  return await validateEarningProcess(address, params, path, balanceService);
}

export async function handleYieldStep (address: string, yieldPoolInfo: YieldPoolInfo, params: OptimalYieldPathParams, requestData: RequestYieldStepSubmit, path: OptimalYieldPath, currentStep: number, balanceService: BalanceService): Promise<HandleYieldStepData> {
  if (yieldPoolInfo.type === YieldPoolType.NATIVE_STAKING) {
    const _data = requestData.data as SubmitJoinNativeStaking;
    const extrinsic = await getNativeStakingBondExtrinsic(address, params, _data);

    const bondingData: RequestBondingSubmit = {
      chain: yieldPoolInfo.chain,
      type: StakingType.NOMINATED,
      nominatorMetadata: _data.nominatorMetadata, // undefined if user has no stake
      amount: _data.amount,
      address,
      selectedValidators: _data.selectedValidators
    };

    return {
      txChain: yieldPoolInfo.chain,
      extrinsicType: ExtrinsicType.STAKING_BOND,
      extrinsic,
      txData: bondingData,
      transferNativeAmount: _data.amount
    };
  } else if (yieldPoolInfo.slug === 'DOT___acala_liquid_staking') {
    return getAcalaLiquidStakingExtrinsic(address, params, path, currentStep, requestData, balanceService);
  } else if (yieldPoolInfo.slug === 'DOT___bifrost_liquid_staking') {
    return getBifrostLiquidStakingExtrinsic(address, params, path, currentStep, requestData, balanceService);
  } else if (yieldPoolInfo.slug === 'DOT___parallel_liquid_staking') {
    return getParallelLiquidStakingExtrinsic(address, params, path, currentStep, requestData, balanceService);
  } else if (yieldPoolInfo.slug === 'DOT___interlay_lending') {
    return getInterlayLendingExtrinsic(address, params, path, currentStep, requestData, balanceService);
  } else if (yieldPoolInfo.slug === 'xcDOT___stellaswap_liquid_staking') {
    return getStellaswapLiquidStakingExtrinsic(address, params, path, currentStep, requestData);
  }

  const _data = requestData.data as SubmitJoinNominationPool;

  const extrinsic = await getNominationPoolJoinExtrinsic(address, params, _data);

  const joinPoolData: RequestStakePoolingBonding = {
    nominatorMetadata: _data.nominatorMetadata,
    chain: yieldPoolInfo.chain,
    selectedPool: _data.selectedPool,
    amount: _data.amount,
    address
  };

  return {
    txChain: yieldPoolInfo.chain,
    extrinsicType: ExtrinsicType.STAKING_JOIN_POOL,
    extrinsic,
    txData: joinPoolData,
    transferNativeAmount: _data.amount
  };
}

export async function handleYieldRedeem (params: OptimalYieldPathParams, address: string, amount: string, yieldPositionInfo: YieldPositionInfo): Promise<[ExtrinsicType, SubmittableExtrinsic<'promise'>]> {
  if (params.poolInfo.slug === 'DOT___acala_liquid_staking') {
    return getAcalaLiquidStakingRedeem(params, amount);
  } else if (params.poolInfo.slug === 'DOT___parallel_liquid_staking') {
    return getParallelLiquidStakingRedeem(params, amount, address);
  } else if (params.poolInfo.slug === 'DOT___interlay_lending') {
    return getInterlayLendingRedeem(params, amount, yieldPositionInfo);
  }

  return getBifrostLiquidStakingRedeem(params, amount);
}

export async function handleLiquidStakingDefaultUnstake (params: UnbondingSubmitParams, substrateApiMap: Record<string, _SubstrateApi>, evmApiMap: Record<string, _EvmApi>, poolInfo: YieldPoolInfo, assetInfoMap: Record<string, _ChainAsset>): Promise<SubmittableExtrinsic<'promise'> | TransactionConfig> {
  if (params.chain === 'acala') {
    return getAcalaLiquidStakingDefaultUnstake(params, substrateApiMap[params.chain]);
  } else if (params.chain === 'parallel') {
    return getParallelLiquidStakingDefaultUnstake(params, substrateApiMap[params.chain]);
  } else if (params.chain === 'moonbeam' && poolInfo.slug === 'xcDOT___stellaswap_liquid_staking') {
    return getStellaswapLiquidStakingDefaultUnstake(params, evmApiMap, poolInfo, assetInfoMap);
  }

  return getBifrostLiquidStakingDefaultUnstake(params, substrateApiMap[params.chain], poolInfo, assetInfoMap);
}

export async function handleLiquidStakingDefaultWithdraw (poolInfo: YieldPoolInfo, substrateApi: _SubstrateApi, evmApiMap: Record<string, _EvmApi>, nominatorMetadata: NominatorMetadata, assetInfoMap: Record<string, _ChainAsset>): Promise<SubmittableExtrinsic<'promise'> | TransactionConfig> {
  if (poolInfo.chain === 'parallel') {
    return getParallelLiquidStakingDefaultWithdraw(nominatorMetadata, substrateApi);
  } else if (poolInfo.chain === 'moonbeam' && poolInfo.slug === 'xcDOT___stellaswap_liquid_staking') {
    return getStellaswapLiquidStakingDefaultWithdraw(poolInfo, evmApiMap, nominatorMetadata, assetInfoMap);
  }

  return getAcalaLiquidStakingDefaultWithdraw(nominatorMetadata, substrateApi);
}
