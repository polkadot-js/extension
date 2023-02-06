// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _KNOWN_CHAIN_INFLATION_PARAMS, _STAKING_CHAIN_GROUP, _SUBSTRATE_DEFAULT_INFLATION_PARAMS, _SubstrateInflationParams } from '@subwallet/extension-base/services/chain-service/constants';
import { parseRawNumber } from '@subwallet/extension-koni-base/utils';

import { BN, BN_BILLION, BN_HUNDRED, BN_MILLION, BN_THOUSAND } from '@polkadot/util';

export const REVOKE_ACTION = 'revoke';
export const BOND_LESS_ACTION = 'bondLess';
export const DECREASE_ACTION = 'decrease'; // for bifrost

export interface ValidatorExtraInfo {
  commission: string,
  blocked: false,
  identity?: string,
  isVerified: boolean
}

export interface Unlocking {
  remainingEras: BN;
  value: BN;
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

export function calculateAlephZeroValidatorReturn (chainStakedReturn: number, commission: number) {
  return chainStakedReturn * (100 - commission) / 100;
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
