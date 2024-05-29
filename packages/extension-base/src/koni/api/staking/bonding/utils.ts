// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { NominationInfo, NominatorMetadata, StakingType, UnstakingInfo } from '@subwallet/extension-base/background/KoniTypes';
import { getAstarWithdrawable } from '@subwallet/extension-base/koni/api/staking/bonding/astar';
import { _KNOWN_CHAIN_INFLATION_PARAMS, _SUBSTRATE_DEFAULT_INFLATION_PARAMS, _SubstrateInflationParams } from '@subwallet/extension-base/services/chain-service/constants';
import { _getChainNativeTokenBasicInfo } from '@subwallet/extension-base/services/chain-service/utils';
import { _STAKING_CHAIN_GROUP } from '@subwallet/extension-base/services/earning-service/constants';
import { EarningStatus, PalletStakingEraRewardPoints, UnstakingStatus, YieldPoolInfo, YieldPoolType, YieldPositionInfo } from '@subwallet/extension-base/types';
import { detectTranslate, parseRawNumber, reformatAddress } from '@subwallet/extension-base/utils';
import { balanceFormatter, formatNumber } from '@subwallet/extension-base/utils/number';
import BigNumber from 'bignumber.js';
import { t } from 'i18next';

import { ApiPromise } from '@polkadot/api';
import { Codec } from '@polkadot/types/types';
import { BN, BN_BILLION, BN_HUNDRED, BN_MILLION, BN_THOUSAND, BN_ZERO, bnToU8a, stringToU8a, u8aConcat } from '@polkadot/util';

export interface PalletDappsStakingDappInfo {
  address: string,
  name: string,
  gitHubUrl: string,
  tags: string[],
  url: string,
  imagesUrl: string[]
}

export interface PalletDappsStakingUnlockingChunk {
  amount: number,
  unlockEra: number
}

export interface PalletDappsStakingAccountLedger {
  locked: number,
  unbondingInfo: {
    unlockingChunks: PalletDappsStakingUnlockingChunk[]
  }
}

export interface BlockHeader {
  parentHash: string,
  number: number,
  stateRoot: string,
  extrinsicsRoot: string
}

export interface ParachainStakingStakeOption {
  owner: string,
  amount: number
}

export interface KrestDelegateState {
  delegations: ParachainStakingStakeOption[],
  total: string
}

export interface ParachainStakingCandidateMetadata {
  bond: string,
  delegationCount: number,
  totalCounted: string,
  lowestTopDelegationAmount: string,
  status: any | 'Active'
}

export enum PalletParachainStakingRequestType {
  REVOKE = 'revoke',
  DECREASE = 'decrease',
  BOND_LESS = 'bondLess'
}

export interface PalletParachainStakingDelegationRequestsScheduledRequest {
  delegator: string,
  whenExecutable: number,
  action: Record<PalletParachainStakingRequestType, number>
}

export interface PalletParachainStakingDelegationInfo {
  owner: string,
  amount: number
}

export interface PalletParachainStakingDelegator {
  id: string,
  delegations: PalletParachainStakingDelegationInfo[],
  total: number,
  lessTotal: number,
  status: number
}

export interface PalletIdentityRegistration {
  judgements: any[],
  deposit: number,
  info: {
    display: {
      Raw: string
    },
    web: {
      Raw: string
    },
    twitter: {
      Raw: string
    },
    riot: {
      Raw: string
    }
  }
}

export type PalletIdentitySuper = [string, { Raw: string }]

export interface Unlocking {
  remainingEras: BN;
  value: BN;
}

export function parsePoolStashAddress (api: ApiPromise, index: number, poolId: number, poolsPalletId: string) {
  const ModPrefix = stringToU8a('modl');
  const U32Opts = { bitLength: 32, isLe: true };
  const EmptyH256 = new Uint8Array(32);

  return api.registry
    .createType(
      'AccountId32',
      u8aConcat(
        ModPrefix,
        poolsPalletId,
        new Uint8Array([index]),
        bnToU8a(new BN(poolId.toString()), U32Opts),
        EmptyH256
      )
    )
    .toString();
}

export function transformPoolName (input: string): string {
  return input.replace(/[^\x20-\x7E]/g, '');
}

export function getInflationParams (networkKey: string): _SubstrateInflationParams {
  return _KNOWN_CHAIN_INFLATION_PARAMS[networkKey] || _SUBSTRATE_DEFAULT_INFLATION_PARAMS;
}

export function calcInflationUniformEraPayout (totalIssuance: BN, yearlyInflationInTokens: number): number {
  const totalIssuanceInTokens = totalIssuance.div(BN_BILLION).div(BN_THOUSAND).toNumber();

  return (totalIssuanceInTokens === 0 ? 0.0 : yearlyInflationInTokens / totalIssuanceInTokens);
}

export function calcInflationRewardCurve (minInflation: number, stakedFraction: number, idealStake: number, idealInterest: number, falloff: number) {
  return (minInflation + (
    stakedFraction <= idealStake
      ? (stakedFraction * (idealInterest - (minInflation / idealStake)))
      : (((idealInterest * idealStake) - minInflation) * Math.pow(2, (idealStake - stakedFraction) / falloff))
  ));
}

export function calculateInflation (totalEraStake: BN, totalIssuance: BN, numAuctions: number, networkKey: string) {
  const inflationParams = getInflationParams(networkKey);
  const { auctionAdjust, auctionMax, falloff, maxInflation, minInflation, stakeTarget } = inflationParams;
  const idealStake = stakeTarget - (Math.min(auctionMax, numAuctions) * auctionAdjust);
  const idealInterest = maxInflation / idealStake;
  const stakedFraction = totalEraStake.mul(BN_MILLION).div(totalIssuance).toNumber() / BN_MILLION.toNumber();

  if (_STAKING_CHAIN_GROUP.aleph.includes(networkKey)) {
    if (inflationParams.yearlyInflationInTokens) {
      return 100 * calcInflationUniformEraPayout(totalIssuance, inflationParams.yearlyInflationInTokens);
    } else {
      return 100 * calcInflationRewardCurve(minInflation, stakedFraction, idealStake, idealInterest, falloff);
    }
  } else {
    return 100 * (minInflation + (
      stakedFraction <= idealStake
        ? (stakedFraction * (idealInterest - (minInflation / idealStake)))
        : (((idealInterest * idealStake) - minInflation) * Math.pow(2, (idealStake - stakedFraction) / falloff))
    ));
  }
}

export function calculateChainStakedReturn (inflation: number, totalEraStake: BN, totalIssuance: BN, networkKey: string) {
  const stakedFraction = totalEraStake.mul(BN_MILLION).div(totalIssuance).toNumber() / BN_MILLION.toNumber();

  let stakedReturn = inflation / stakedFraction;

  if (_STAKING_CHAIN_GROUP.aleph.includes(networkKey)) {
    stakedReturn *= 0.9; // 10% goes to treasury
  }

  return stakedReturn;
}

export function calculateChainStakedReturnV2 (chainInfo: _ChainInfo, totalIssuance: string, erasPerDay: number, lastTotalStaked: string, validatorEraReward: BigNumber, isCompound?: boolean) {
  const DAYS_PER_YEAR = 365;
  // @ts-ignore
  const DECIMAL = chainInfo.substrateInfo.decimals;

  const lastTotalStakedUnit = (new BigNumber(lastTotalStaked)).dividedBy(new BigNumber(10 ** DECIMAL));
  const totalIssuanceUnit = (new BigNumber(totalIssuance)).dividedBy(new BigNumber(10 ** DECIMAL));
  const supplyStaked = lastTotalStakedUnit.dividedBy(totalIssuanceUnit);

  const dayRewardRate = validatorEraReward.multipliedBy(erasPerDay).dividedBy(totalIssuance).multipliedBy(100);

  let inflationToStakers: BigNumber = new BigNumber(0);

  if (!isCompound) {
    inflationToStakers = dayRewardRate.multipliedBy(DAYS_PER_YEAR);
  } else {
    const multiplier = dayRewardRate.dividedBy(100).plus(1).exponentiatedBy(365);

    inflationToStakers = new BigNumber(100).multipliedBy(multiplier).minus(100);
  }

  const averageRewardRate = inflationToStakers.dividedBy(supplyStaked);

  return averageRewardRate.toNumber();
}

export function calculateAlephZeroValidatorReturn (chainStakedReturn: number, commission: number) {
  return chainStakedReturn * (100 - commission) / 100;
}

export function calculateTernoaValidatorReturn (rewardPerValidator: number, validatorStake: number, commission: number) {
  const percentRewardForNominators = (100 - commission) / 100;
  const rewardForNominators = rewardPerValidator * percentRewardForNominators;

  const stakeRatio = rewardForNominators / validatorStake;

  return stakeRatio * 365 * 100;
}

export function calculateValidatorStakedReturn (chainStakedReturn: number, totalValidatorStake: BN, avgStake: BN, commission: number) {
  const bnAdjusted = avgStake.mul(BN_HUNDRED).div(totalValidatorStake);
  const adjusted = bnAdjusted.toNumber() * chainStakedReturn;

  const stakedReturn = (adjusted > Number.MAX_SAFE_INTEGER ? Number.MAX_SAFE_INTEGER : adjusted) / 100;

  return stakedReturn * (100 - commission) / 100; // Deduct commission
}

export function getCommission (commissionString: string) {
  return parseFloat(commissionString.split('%')[0]); // Example: 12%
}

export interface InflationConfig {
  expect: {
    min: string,
    ideal: string,
    max: string
  },
  annual: {
    min: string,
    ideal: string,
    max: string
  },
  round: {
    min: string,
    ideal: string,
    max: string
  }
}

export function getParaCurrentInflation (totalStaked: number, inflationConfig: InflationConfig) { // read more at https://hackmd.io/@sbAqOuXkRvyiZPOB3Ryn6Q/Sypr3ZJh5
  const expectMin = parseRawNumber(inflationConfig.expect.min);
  const expectMax = parseRawNumber(inflationConfig.expect.max);

  if (totalStaked < expectMin) {
    const inflationString = inflationConfig.annual.min.split('%')[0];

    return parseFloat(inflationString);
  } else if (totalStaked > expectMax) {
    const inflationString = inflationConfig.annual.max.split('%')[0];

    return parseFloat(inflationString);
  }

  const inflationString = inflationConfig.annual.ideal.split('%')[0];

  return parseFloat(inflationString);
}

export interface TuringOptimalCompoundFormat {
  period: string; // in days
  apy: string;
}

// validations and check conditions
export function isShowNominationByValidator (chain: string): 'showByValue' | 'showByValidator' | 'mixed' {
  if (_STAKING_CHAIN_GROUP.amplitude.includes(chain)) {
    return 'showByValue';
  } else if (_STAKING_CHAIN_GROUP.astar.includes(chain)) {
    return 'mixed';
  } else if (_STAKING_CHAIN_GROUP.para.includes(chain)) {
    return 'showByValidator';
  }

  return 'showByValue';
}

export function getBondedValidators (nominations: NominationInfo[]) {
  const bondedValidators: string[] = [];
  let nominationCount = 0;

  for (const nomination of nominations) {
    nominationCount += 1;
    bondedValidators.push(reformatAddress(nomination.validatorAddress, 0));
  }

  return {
    nominationCount,
    bondedValidators
  };
}

export function isUnstakeAll (selectedValidator: string, nominations: NominationInfo[], unstakeAmount: string) {
  let isUnstakeAll = false;

  for (const nomination of nominations) {
    const parsedValidatorAddress = reformatAddress(nomination.validatorAddress, 0);
    const parsedSelectedValidator = reformatAddress(selectedValidator, 0);

    if (parsedValidatorAddress === parsedSelectedValidator) {
      if (unstakeAmount === nomination.activeStake) {
        isUnstakeAll = true;
      }

      break;
    }
  }

  return isUnstakeAll;
}

export enum YieldAction {
  STAKE = 'STAKE',
  UNSTAKE = 'UNSTAKE',
  WITHDRAW = 'WITHDRAW',
  CLAIM_REWARD = 'CLAIM_REWARD',
  CANCEL_UNSTAKE = 'CANCEL_UNSTAKE',

  START_EARNING = 'EARN',
  WITHDRAW_EARNING = 'WITHDRAW_EARNING',
  CUSTOM_ACTION = 'CUSTOM_ACTION'
}

export function getYieldAvailableActionsByType (yieldPoolInfo: YieldPoolInfo): YieldAction[] {
  if ([YieldPoolType.NATIVE_STAKING, YieldPoolType.NOMINATION_POOL].includes(yieldPoolInfo.type)) {
    if (yieldPoolInfo.type === YieldPoolType.NOMINATION_POOL) {
      return [YieldAction.STAKE, YieldAction.CLAIM_REWARD, YieldAction.UNSTAKE, YieldAction.WITHDRAW];
    }

    const chain = yieldPoolInfo.chain;

    if (_STAKING_CHAIN_GROUP.para.includes(chain)) {
      return [YieldAction.STAKE, YieldAction.UNSTAKE, YieldAction.WITHDRAW, YieldAction.CANCEL_UNSTAKE];
    } else if (_STAKING_CHAIN_GROUP.astar.includes(chain)) {
      return [YieldAction.STAKE, YieldAction.CLAIM_REWARD, YieldAction.UNSTAKE, YieldAction.WITHDRAW];
    } else if (_STAKING_CHAIN_GROUP.amplitude.includes(chain)) {
      return [YieldAction.STAKE, YieldAction.UNSTAKE, YieldAction.WITHDRAW];
    }
  }

  if (yieldPoolInfo.type === YieldPoolType.LENDING) {
    return [YieldAction.START_EARNING, YieldAction.WITHDRAW_EARNING];
  } else if (yieldPoolInfo.type === YieldPoolType.LIQUID_STAKING) {
    return [YieldAction.START_EARNING, YieldAction.UNSTAKE, YieldAction.WITHDRAW];
  }

  return [YieldAction.STAKE, YieldAction.UNSTAKE, YieldAction.WITHDRAW, YieldAction.CANCEL_UNSTAKE];
}

export function getYieldAvailableActionsByPosition (yieldPosition: YieldPositionInfo, yieldPoolInfo: YieldPoolInfo, unclaimedReward?: string): YieldAction[] {
  const result: YieldAction[] = [];

  if ([YieldPoolType.NATIVE_STAKING, YieldPoolType.NOMINATION_POOL].includes(yieldPoolInfo.type)) {
    result.push(YieldAction.STAKE);

    const bnActiveStake = new BigNumber(yieldPosition.activeStake);

    if (yieldPosition.activeStake && bnActiveStake.gt('0')) {
      result.push(YieldAction.UNSTAKE);

      const isAstarNetwork = _STAKING_CHAIN_GROUP.astar.includes(yieldPosition.chain);
      const isAmplitudeNetwork = _STAKING_CHAIN_GROUP.amplitude.includes(yieldPosition.chain);
      const bnUnclaimedReward = new BigNumber(unclaimedReward || '0');

      if (
        ((yieldPosition.type === YieldPoolType.NOMINATION_POOL || isAmplitudeNetwork) && bnUnclaimedReward.gt('0')) ||
        isAstarNetwork
      ) {
        result.push(YieldAction.CLAIM_REWARD);
      }
    }

    if (yieldPosition.unstakings.length > 0) {
      result.push(YieldAction.CANCEL_UNSTAKE);
      const hasClaimable = yieldPosition.unstakings.some((unstaking) => unstaking.status === UnstakingStatus.CLAIMABLE);

      if (hasClaimable) {
        result.push(YieldAction.WITHDRAW);
      }
    }
  } else if (yieldPoolInfo.type === YieldPoolType.LIQUID_STAKING) {
    result.push(YieldAction.START_EARNING);

    const activeBalance = new BigNumber(yieldPosition.activeStake);

    if (activeBalance.gt('0')) {
      result.push(YieldAction.UNSTAKE);
    }

    const hasWithdrawal = yieldPosition.unstakings.some((unstakingInfo) => unstakingInfo.status === UnstakingStatus.CLAIMABLE);

    if (hasWithdrawal) {
      result.push(YieldAction.WITHDRAW);
    }

    // TODO: check has unstakings to withdraw
  } else {
    result.push(YieldAction.START_EARNING);
    result.push(YieldAction.WITHDRAW_EARNING); // TODO
  }

  return result;
}

export enum StakingAction {
  STAKE = 'STAKE',
  UNSTAKE = 'UNSTAKE',
  WITHDRAW = 'WITHDRAW',
  CLAIM_REWARD = 'CLAIM_REWARD',
  CANCEL_UNSTAKE = 'CANCEL_UNSTAKE'
}

export function getStakingAvailableActionsByChain (chain: string, type: StakingType): StakingAction[] {
  if (type === StakingType.POOLED) {
    return [StakingAction.STAKE, StakingAction.UNSTAKE, StakingAction.WITHDRAW, StakingAction.CLAIM_REWARD];
  }

  if (_STAKING_CHAIN_GROUP.para.includes(chain)) {
    return [StakingAction.STAKE, StakingAction.UNSTAKE, StakingAction.WITHDRAW, StakingAction.CANCEL_UNSTAKE];
  } else if (_STAKING_CHAIN_GROUP.astar.includes(chain)) {
    return [StakingAction.STAKE, StakingAction.UNSTAKE, StakingAction.WITHDRAW, StakingAction.CLAIM_REWARD];
  } else if (_STAKING_CHAIN_GROUP.amplitude.includes(chain)) {
    return [StakingAction.STAKE, StakingAction.UNSTAKE, StakingAction.WITHDRAW];
  }

  return [StakingAction.STAKE, StakingAction.UNSTAKE, StakingAction.WITHDRAW, StakingAction.CANCEL_UNSTAKE];
}

export function getStakingAvailableActionsByNominator (nominatorMetadata: NominatorMetadata, unclaimedReward?: string): StakingAction[] {
  const result: StakingAction[] = [StakingAction.STAKE];

  const bnActiveStake = new BN(nominatorMetadata.activeStake);

  if (nominatorMetadata.activeStake && bnActiveStake.gt(BN_ZERO)) {
    result.push(StakingAction.UNSTAKE);

    const isAstarNetwork = _STAKING_CHAIN_GROUP.astar.includes(nominatorMetadata.chain);
    const isAmplitudeNetwork = _STAKING_CHAIN_GROUP.amplitude.includes(nominatorMetadata.chain);
    const bnUnclaimedReward = new BN(unclaimedReward || '0');

    if (
      ((nominatorMetadata.type === StakingType.POOLED || isAmplitudeNetwork) && bnUnclaimedReward.gt(BN_ZERO)) ||
      isAstarNetwork
    ) {
      result.push(StakingAction.CLAIM_REWARD);
    }
  }

  if (nominatorMetadata.unstakings.length > 0) {
    result.push(StakingAction.CANCEL_UNSTAKE);
    const hasClaimable = nominatorMetadata.unstakings.some((unstaking) => unstaking.status === UnstakingStatus.CLAIMABLE);

    if (hasClaimable) {
      result.push(StakingAction.WITHDRAW);
    }
  }

  return result;
}

export function isActionFromValidator (stakingType: StakingType, chain: string) {
  if (stakingType === StakingType.POOLED || stakingType === StakingType.LIQUID_STAKING) {
    return false;
  }

  if (_STAKING_CHAIN_GROUP.astar.includes(chain)) {
    return true;
  } else if (_STAKING_CHAIN_GROUP.amplitude.includes(chain)) {
    return true;
  } else if (_STAKING_CHAIN_GROUP.para.includes(chain)) {
    return true;
  }

  return false;
}

export function getWithdrawalInfo (nominatorMetadata: NominatorMetadata) {
  const unstakings = nominatorMetadata.unstakings;

  let result: UnstakingInfo | undefined;

  if (_STAKING_CHAIN_GROUP.astar.includes(nominatorMetadata.chain)) {
    return getAstarWithdrawable(nominatorMetadata);
  }

  for (const unstaking of unstakings) {
    if (unstaking.status === UnstakingStatus.CLAIMABLE) {
      result = unstaking; // only get the first withdrawal
      break;
    }
  }

  return result;
}

export function getEarningStatusByNominations (bnTotalActiveStake: BN, nominationList: NominationInfo[]): EarningStatus {
  let stakingStatus: EarningStatus = EarningStatus.EARNING_REWARD;

  if (bnTotalActiveStake.isZero()) {
    stakingStatus = EarningStatus.NOT_EARNING;
  } else {
    let invalidDelegationCount = 0;

    for (const nomination of nominationList) {
      if (nomination.status === EarningStatus.NOT_EARNING) {
        invalidDelegationCount += 1;
      }
    }

    if (invalidDelegationCount > 0 && invalidDelegationCount < nominationList.length) {
      stakingStatus = EarningStatus.PARTIALLY_EARNING;
    } else if (invalidDelegationCount === nominationList.length) {
      stakingStatus = EarningStatus.NOT_EARNING;
    }
  }

  return stakingStatus;
}

export function getValidatorLabel (chain: string) {
  if (_STAKING_CHAIN_GROUP.astar.includes(chain)) {
    return 'dApp';
  } else if (_STAKING_CHAIN_GROUP.relay.includes(chain)) {
    return 'Validator';
  }

  return 'Collator';
}

export function getAvgValidatorEraReward (supportedDays: number, eraRewardHistory: Codec[]) {
  let sumEraReward = new BigNumber(0);
  let failEra = 0;

  for (const _item of eraRewardHistory) {
    const item = _item.toString();

    if (!item) {
      failEra += 1;
    } else {
      const eraReward = new BigNumber(item);

      sumEraReward = sumEraReward.plus(eraReward);
    }
  }

  return sumEraReward.dividedBy(new BigNumber(supportedDays - failEra));
}

export function getSupportedDaysByHistoryDepth (erasPerDay: number, maxSupportedEras: number, liveDay?: number) {
  const maxSupportDay = maxSupportedEras / erasPerDay;

  if (liveDay && liveDay <= 30) {
    return Math.min(liveDay - 1, maxSupportDay);
  }

  if (maxSupportDay > 30) {
    return 30;
  } else {
    return maxSupportDay;
  }
}

export function getValidatorPointsMap (eraRewardMap: Record<string, PalletStakingEraRewardPoints>) {
  // mapping store validator and totalPoints
  const validatorTotalPointsMap: Record<string, BigNumber> = {};

  Object.values(eraRewardMap).forEach((info) => {
    const individual = info.individual;

    Object.entries(individual).forEach(([validator, rawPoints]) => {
      const points = rawPoints.replaceAll(',', '');

      if (!validatorTotalPointsMap[validator]) {
        validatorTotalPointsMap[validator] = new BigNumber(points);
      } else {
        validatorTotalPointsMap[validator] = validatorTotalPointsMap[validator].plus(points);
      }
    });
  });

  return validatorTotalPointsMap;
}

export function getTopValidatorByPoints (validatorPointsList: Record<string, BigNumber>) {
  const sortValidatorPointsList = Object.fromEntries(
    Object.entries(validatorPointsList)
      .sort(
        (
          a: [string, BigNumber],
          b: [string, BigNumber]
        ) => a[1].minus(b[1]).toNumber()
      )
      .reverse()
  );

  // keep 50% first validator
  const entries = Object.entries(sortValidatorPointsList);
  const endIndex = Math.ceil(entries.length / 2);
  const top50PercentEntries = entries.slice(0, endIndex);
  const top50PercentRecord = Object.fromEntries(top50PercentEntries);

  return Object.keys(top50PercentRecord);
}

export const getMinStakeErrorMessage = (chainInfo: _ChainInfo, bnMinStake: BN): string => {
  const tokenInfo = _getChainNativeTokenBasicInfo(chainInfo);
  const number = formatNumber(bnMinStake.toString(), tokenInfo.decimals || 0, balanceFormatter);

  return t('Insufficient stake. Please stake at least {{number}} {{tokenSymbol}} to get rewards', { replace: { tokenSymbol: tokenInfo.symbol, number } });
};

export const getMaxValidatorErrorMessage = (chainInfo: _ChainInfo, max: number): string => {
  let message = detectTranslate('You cannot select more than {{number}} validators for this network');
  const label = getValidatorLabel(chainInfo.slug);

  if (max > 1) {
    switch (label) {
      case 'dApp':
        message = detectTranslate('You cannot select more than {{number}} dApps for this network');
        break;
      case 'Collator':
        message = detectTranslate('You cannot select more than {{number}} collators for this network');
        break;
      case 'Validator':
        message = detectTranslate('You cannot select more than {{number}} validators for this network');
        break;
    }
  } else {
    switch (label) {
      case 'dApp':
        message = detectTranslate('You cannot select more than {{number}} dApp for this network');
        break;
      case 'Collator':
        message = detectTranslate('You cannot select more than {{number}} collator for this network');
        break;
      case 'Validator':
        message = detectTranslate('You cannot select more than {{number}} validator for this network');
        break;
    }
  }

  return t(message, { replace: { number: max } });
};

export const getExistUnstakeErrorMessage = (chain: string, type?: StakingType, isStakeMore?: boolean): string => {
  const label = getValidatorLabel(chain);

  if (!isStakeMore) {
    switch (label) {
      case 'dApp':
        return t('You can unstake from a dApp once');
      case 'Collator':
        return t('You can unstake from a collator once');

      case 'Validator': {
        if (type === StakingType.POOLED) {
          return t('You can unstake from a pool once');
        }

        return t('You can unstake from a validator once');
      }
    }
  } else {
    switch (label) {
      case 'dApp':
        return t('You cannot stake more for a dApp you are unstaking from');
      case 'Collator':
        return t('You cannot stake more for a collator you are unstaking from');

      case 'Validator': {
        if (type === StakingType.POOLED) {
          return t('You cannot stake more for a pool you are unstaking from');
        }

        return t('You cannot stake more for a validator you are unstaking from');
      }
    }
  }
};
