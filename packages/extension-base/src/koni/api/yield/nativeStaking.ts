// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { OptimalYieldPath, OptimalYieldPathParams, YieldPoolInfo, YieldPoolType, YieldStepType } from '@subwallet/extension-base/background/KoniTypes';
import { calculateChainStakedReturn, calculateInflation } from '@subwallet/extension-base/koni/api/staking/bonding/utils';
import { YIELD_POOLS_INFO } from '@subwallet/extension-base/koni/api/yield/data';
import { DEFAULT_YIELD_FIRST_STEP, fakeAddress, RuntimeDispatchInfo, syntheticSelectedValidators } from '@subwallet/extension-base/koni/api/yield/utils';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getChainNativeTokenSlug } from '@subwallet/extension-base/services/chain-service/utils';

import { Codec } from '@polkadot/types/types';
import { BN } from '@polkadot/util';

export function subscribeNativeStakingYieldStats (poolInfo: YieldPoolInfo, substrateApi: _SubstrateApi, chainInfo: _ChainInfo, callback: (rs: YieldPoolInfo) => void) {
  return substrateApi.api.query.staking.currentEra(async (_currentEra: Codec) => {
    const currentEra = _currentEra.toString();
    const maxNominations = substrateApi.api.consts.staking.maxNominations.toString();
    const maxUnlockingChunks = substrateApi.api.consts.staking.maxUnlockingChunks.toString();

    const [_totalEraStake, _totalIssuance, _auctionCounter, _minNominatorBond, _minPoolJoin, _minimumActiveStake] = await Promise.all([
      substrateApi.api.query.staking.erasTotalStake(parseInt(currentEra)),
      substrateApi.api.query.balances.totalIssuance(),
      substrateApi.api.query.auctions?.auctionCounter(),
      substrateApi.api.query.staking.minNominatorBond(),
      substrateApi.api.query?.nominationPools?.minJoinBond(),
      substrateApi.api.query?.staking?.minimumActiveStake && substrateApi.api.query?.staking?.minimumActiveStake()
    ]);

    const minActiveStake = _minimumActiveStake?.toString() || '0';
    const minNominatorBond = _minNominatorBond.toString();

    const bnMinActiveStake = new BN(minActiveStake);
    const bnMinNominatorBond = new BN(minNominatorBond);

    const minStake = bnMinActiveStake.gt(bnMinNominatorBond) ? bnMinActiveStake : bnMinNominatorBond;
    const rawTotalEraStake = _totalEraStake.toString();
    const rawTotalIssuance = _totalIssuance.toString();

    const numAuctions = _auctionCounter ? _auctionCounter.toHuman() as number : 0;
    const bnTotalEraStake = new BN(rawTotalEraStake);
    const bnTotalIssuance = new BN(rawTotalIssuance);

    const inflation = calculateInflation(bnTotalEraStake, bnTotalIssuance, numAuctions, chainInfo.slug);
    const minPoolJoin = _minPoolJoin?.toString() || undefined;
    const expectedReturn = calculateChainStakedReturn(inflation, bnTotalEraStake, bnTotalIssuance, chainInfo.slug);

    // eslint-disable-next-line node/no-callback-literal
    callback({
      ...poolInfo,
      stats: {
        assetEarning: [
          {
            slug: _getChainNativeTokenSlug(chainInfo),
            apr: expectedReturn
          }
        ],
        maxCandidatePerFarmer: parseInt(maxNominations),
        maxWithdrawalRequestPerFarmer: parseInt(maxUnlockingChunks),
        minJoinPool: minStake.toString(),
        minWithdrawal: '0',
        totalApr: expectedReturn,
        tvl: bnTotalEraStake.toString()
      }
    });

    // eslint-disable-next-line node/no-callback-literal
    callback({ // TODO
      ...YIELD_POOLS_INFO.DOT___nomination_pool,
      stats: {
        assetEarning: [
          {
            slug: _getChainNativeTokenSlug(chainInfo),
            apr: expectedReturn
          }
        ],
        maxCandidatePerFarmer: parseInt(maxNominations),
        maxWithdrawalRequestPerFarmer: parseInt(maxUnlockingChunks),
        minJoinPool: minPoolJoin || '0',
        minWithdrawal: '0',
        totalApr: expectedReturn,
        tvl: bnTotalEraStake.toString()
      }
    });
  });
}

export async function generatePathForNativeStaking (params: OptimalYieldPathParams): Promise<OptimalYieldPath> {
  const bnAmount = new BN(params.amount);
  const result: OptimalYieldPath = {
    totalFee: [],
    steps: [DEFAULT_YIELD_FIRST_STEP]
  };

  const feeAsset = params.poolInfo.feeAssets[0];
  const substrateApi = await params.substrateApiMap[params.poolInfo.chain].isReady;

  if (params.poolInfo.type === YieldPoolType.NATIVE_STAKING) {
    // TODO: check existing position
    result.steps.push({
      id: result.steps.length,
      name: 'Nominate validators',
      type: YieldStepType.NOMINATE
    });

    const [_bondFeeInfo, _nominateFeeInfo] = await Promise.all([
      substrateApi.api.tx.staking.bond(bnAmount, 'Staked').paymentInfo(fakeAddress),
      substrateApi.api.tx.staking.nominate(syntheticSelectedValidators).paymentInfo(fakeAddress)
    ]);

    const bondFeeInfo = _bondFeeInfo.toPrimitive() as unknown as RuntimeDispatchInfo;
    const nominateFeeInfo = _nominateFeeInfo.toPrimitive() as unknown as RuntimeDispatchInfo;

    const totalFee = bondFeeInfo.partialFee + nominateFeeInfo.partialFee;

    result.totalFee.push({
      slug: feeAsset,
      amount: totalFee.toString()
    });
  } else {
    // TODO: check existing position
    result.steps.push({
      id: result.steps.length,
      metadata: {
        amount: params.amount
      },
      name: 'Join nomination pool',
      type: YieldStepType.JOIN_NOMINATION_POOL
    });

    const _joinPoolFeeInfo = await substrateApi.api.tx.nominationPools.join(params.amount, 1).paymentInfo(fakeAddress);
    const joinPoolFeeInfo = _joinPoolFeeInfo.toPrimitive() as unknown as RuntimeDispatchInfo;

    result.totalFee.push({
      slug: feeAsset,
      amount: joinPoolFeeInfo.partialFee.toString()
    });
  }

  return result;
}
