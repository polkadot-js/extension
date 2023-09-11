// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { OptimalYieldPath, OptimalYieldPathParams, ValidatorInfo, YieldPoolInfo, YieldPoolType, YieldStepType } from '@subwallet/extension-base/background/KoniTypes';
import { calculateAlephZeroValidatorReturn, calculateChainStakedReturn, calculateInflation, calculateTernoaValidatorReturn, calculateValidatorStakedReturn, getCommission, PalletIdentityRegistration, parseIdentity, TernoaStakingRewardsStakingRewardsData, ValidatorExtraInfo } from '@subwallet/extension-base/koni/api/staking/bonding/utils';
import { YIELD_POOLS_INFO } from '@subwallet/extension-base/koni/api/yield/data';
import { DEFAULT_YIELD_FIRST_STEP, fakeAddress, RuntimeDispatchInfo, syntheticSelectedValidators } from '@subwallet/extension-base/koni/api/yield/utils';
import { _STAKING_CHAIN_GROUP } from '@subwallet/extension-base/services/chain-service/constants';
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

export async function getNativeStakingExtrinsic (substrateApi: _SubstrateApi, amount: string, targetValidators: ValidatorInfo[], chainInfo: _ChainInfo, address: string, bondDest = 'Staked') {
  const chainApi = await substrateApi.isReady;
  const binaryAmount = new BN(amount);

  let bondTx;
  let nominateTx;

  const _params = chainApi.api.tx.staking.bond.toJSON() as Record<string, any>;
  const paramsCount = (_params.args as any[]).length;

  const validatorParamList = targetValidators.map((validator) => {
    return validator.address;
  });

  if (paramsCount === 2) {
    bondTx = chainApi.api.tx.staking.bond(binaryAmount, bondDest);
  } else {
    bondTx = chainApi.api.tx.staking.bond(address, binaryAmount, bondDest);
  }

  nominateTx = chainApi.api.tx.staking.nominate(validatorParamList);

  return chainApi.api.tx.utility.batchAll([bondTx, nominateTx]);

  // if (!nominatorMetadata) {
  //   if (paramsCount === 2) {
  //     bondTx = chainApi.api.tx.staking.bond(binaryAmount, bondDest);
  //   } else {
  //     bondTx = chainApi.api.tx.staking.bond(address, binaryAmount, bondDest);
  //   }
  //
  //   nominateTx = chainApi.api.tx.staking.nominate(validatorParamList);
  //
  //   return chainApi.api.tx.utility.batchAll([bondTx, nominateTx]);
  // }
  //
  // if (!nominatorMetadata.isBondedBefore) { // first time
  //   if (paramsCount === 2) {
  //     bondTx = chainApi.api.tx.staking.bond(binaryAmount, bondDest);
  //   } else {
  //     bondTx = chainApi.api.tx.staking.bond(nominatorMetadata.address, binaryAmount, bondDest);
  //   }
  //
  //   nominateTx = chainApi.api.tx.staking.nominate(validatorParamList);
  //
  //   return chainApi.api.tx.utility.batchAll([bondTx, nominateTx]);
  // } else {
  //   if (binaryAmount.gt(BN_ZERO)) {
  //     bondTx = chainApi.api.tx.staking.bondExtra(binaryAmount);
  //   }
  //
  //   if (nominatorMetadata.isBondedBefore && targetValidators.length > 0) {
  //     nominateTx = chainApi.api.tx.staking.nominate(validatorParamList);
  //   }
  // }
  //
  // if (bondTx && !nominateTx) {
  //   return bondTx;
  // } else if (nominateTx && !bondTx) {
  //   return nominateTx;
  // }
  //
  // return chainApi.api.tx.utility.batchAll([bondTx, nominateTx]);
}

export async function getRelayValidatorsInfo (yieldPoolInfo: YieldPoolInfo, substrateApi: _SubstrateApi, decimals: number): Promise<ValidatorInfo[]> {
  const chainApi = await substrateApi.isReady;

  const _era = await chainApi.api.query.staking.currentEra();
  const currentEra = _era.toString();

  const allValidators: string[] = [];
  const validatorInfoList: ValidatorInfo[] = [];

  const [_totalEraStake, _eraStakers, _minBond, _stakingRewards] = await Promise.all([
    chainApi.api.query.staking.erasTotalStake(parseInt(currentEra)),
    chainApi.api.query.staking.erasStakers.entries(parseInt(currentEra)),
    chainApi.api.query.staking.minNominatorBond(),
    chainApi.api.query.stakingRewards && chainApi.api.query.stakingRewards.data()
  ]);

  const stakingRewards = _stakingRewards?.toPrimitive() as unknown as TernoaStakingRewardsStakingRewardsData;

  const maxNominatorRewarded = chainApi.api.consts.staking.maxNominatorRewardedPerValidator.toString();
  const bnTotalEraStake = new BN(_totalEraStake.toString());
  const eraStakers = _eraStakers as any[];

  const rawMinBond = _minBond.toHuman() as string;
  const minBond = rawMinBond.replaceAll(',', '');

  const totalStakeMap: Record<string, BN> = {};
  const bnDecimals = new BN((10 ** decimals).toString());

  for (const item of eraStakers) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    const rawValidatorInfo = item[0].toHuman() as any[];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    const rawValidatorStat = item[1].toHuman() as Record<string, any>;

    const validatorAddress = rawValidatorInfo[1] as string;
    const rawTotalStake = rawValidatorStat.total as string;
    const rawOwnStake = rawValidatorStat.own as string;

    const bnTotalStake = new BN(rawTotalStake.replaceAll(',', ''));
    const bnOwnStake = new BN(rawOwnStake.replaceAll(',', ''));
    const otherStake = bnTotalStake.sub(bnOwnStake);

    totalStakeMap[validatorAddress] = bnTotalStake;

    let nominatorCount = 0;

    if ('others' in rawValidatorStat) {
      const others = rawValidatorStat.others as Record<string, any>[];

      nominatorCount = others.length;
    }

    allValidators.push(validatorAddress);

    validatorInfoList.push({
      address: validatorAddress,
      totalStake: bnTotalStake.toString(),
      ownStake: bnOwnStake.toString(),
      otherStake: otherStake.toString(),
      nominatorCount,
      // to be added later
      commission: 0,
      expectedReturn: 0,
      blocked: false,
      isVerified: false,
      minBond,
      isCrowded: nominatorCount > parseInt(maxNominatorRewarded)
    } as ValidatorInfo);
  }

  const extraInfoMap: Record<string, ValidatorExtraInfo> = {};

  await Promise.all(allValidators.map(async (address) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const [_commissionInfo, _identityInfo] = await Promise.all([
      chainApi.api.query.staking.validators(address),
      chainApi.api.query?.identity?.identityOf(address)
    ]);

    const commissionInfo = _commissionInfo.toHuman() as Record<string, any>;
    const identityInfo = _identityInfo ? (_identityInfo.toHuman() as unknown as PalletIdentityRegistration) : null;
    let identity;

    if (identityInfo !== null) {
      identity = parseIdentity(identityInfo);
    }

    extraInfoMap[address] = {
      commission: commissionInfo.commission as string,
      blocked: commissionInfo.blocked as boolean,
      identity,
      isVerified: identityInfo && identityInfo?.judgements?.length > 0
    } as ValidatorExtraInfo;
  }));

  const bnAvgStake = bnTotalEraStake.divn(validatorInfoList.length).div(bnDecimals);

  for (const validator of validatorInfoList) {
    const commission = extraInfoMap[validator.address].commission;

    const bnValidatorStake = totalStakeMap[validator.address].div(bnDecimals);

    if (yieldPoolInfo.stats?.totalApr) {
      if (_STAKING_CHAIN_GROUP.aleph.includes(yieldPoolInfo.chain)) {
        validator.expectedReturn = calculateAlephZeroValidatorReturn(yieldPoolInfo.stats?.totalApr, getCommission(commission));
      } else if (_STAKING_CHAIN_GROUP.ternoa.includes(yieldPoolInfo.chain)) {
        const rewardPerValidator = new BN(stakingRewards.sessionExtraRewardPayout).divn(allValidators.length).div(bnDecimals);
        const validatorStake = totalStakeMap[validator.address].div(bnDecimals).toNumber();

        validator.expectedReturn = calculateTernoaValidatorReturn(rewardPerValidator.toNumber(), validatorStake, getCommission(commission));
      } else {
        validator.expectedReturn = calculateValidatorStakedReturn(yieldPoolInfo.stats?.totalApr, bnValidatorStake, bnAvgStake, getCommission(commission));
      }
    }

    validator.commission = parseFloat(commission.split('%')[0]);
    validator.blocked = extraInfoMap[validator.address].blocked;
    validator.identity = extraInfoMap[validator.address].identity;
    validator.isVerified = extraInfoMap[validator.address].isVerified;
  }

  return validatorInfoList;
}
