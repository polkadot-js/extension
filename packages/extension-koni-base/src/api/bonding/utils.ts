// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

export interface ValidatorExtraInfo {
  commission: string,
  blocked: false,
  identity?: string,
  isVerified: boolean
}

export function parseBalanceString (decimals: number, balance: number, unit: string) {
  const unitThreshold = 1000000;
  const parsedBalance = (balance / 10 ** decimals);

  if (parsedBalance > unitThreshold) {
    return (parsedBalance / unitThreshold).toFixed(2).toString() + ' ' + `M${unit}`;
  } else {
    return parsedBalance.toString() + ' ' + unit;
  }
}

export interface InflationParams {
  auctionAdjust: number;
  auctionMax: number;
  falloff: number;
  maxInflation: number;
  minInflation: number;
  stakeTarget: number;
  yearlyInflationInTokens?: number;
}

export interface UniformEraPayoutInflationParams extends InflationParams {
  yearlyInflationInTokens: number;
}

const DEFAULT_PARAMS: InflationParams = {
  auctionAdjust: 0,
  auctionMax: 0,
  falloff: 0.05,
  maxInflation: 0.1,
  minInflation: 0.025,
  stakeTarget: 0.5
};

const ALEPH_DEFAULT_UNIFORM_ERA_PAYOUT_PARAMS: UniformEraPayoutInflationParams = {
  ...DEFAULT_PARAMS,
  yearlyInflationInTokens: 30000000
};

const KNOWN_PARAMS: Record<string, InflationParams> = {
  aleph: ALEPH_DEFAULT_UNIFORM_ERA_PAYOUT_PARAMS,
  alephTest: ALEPH_DEFAULT_UNIFORM_ERA_PAYOUT_PARAMS,
  dock_pos: { ...DEFAULT_PARAMS, stakeTarget: 0.75 },
  kusama: { ...DEFAULT_PARAMS, auctionAdjust: (0.3 / 60), auctionMax: 60, stakeTarget: 0.75 },
  neatcoin: { ...DEFAULT_PARAMS, stakeTarget: 0.75 },
  nft_mart: { ...DEFAULT_PARAMS, falloff: 0.04, stakeTarget: 0.60 },
  polkadot: { ...DEFAULT_PARAMS, stakeTarget: 0.75 }
};

export function getInflationParams (networkKey: string): InflationParams {
  return KNOWN_PARAMS[networkKey] || DEFAULT_PARAMS;
}

export function calcInflationUniformEraPayout (totalIssuance: number, yearlyInflationInTokens: number): number {
  const totalIssuanceInTokens = (totalIssuance / 1000000000) / 1000;

  return (totalIssuanceInTokens === 0 ? 0.0 : yearlyInflationInTokens / totalIssuanceInTokens);
}

export function calcInflationRewardCurve (minInflation: number, stakedFraction: number, idealStake: number, idealInterest: number, falloff: number) {
  return (minInflation + (
    stakedFraction <= idealStake
      ? (stakedFraction * (idealInterest - (minInflation / idealStake)))
      : (((idealInterest * idealStake) - minInflation) * Math.pow(2, (idealStake - stakedFraction) / falloff))
  ));
}

export function calculateInflation (totalEraStake: number, totalIssuance: number, numAuctions: number, networkKey: string) {
  const inflationParams = getInflationParams(networkKey);
  const { auctionAdjust, auctionMax, falloff, maxInflation, minInflation, stakeTarget } = inflationParams;
  const idealStake = stakeTarget - (Math.min(auctionMax, numAuctions) * auctionAdjust);
  const idealInterest = maxInflation / idealStake;
  const stakedFraction = totalEraStake / totalIssuance;

  if (networkKey === 'aleph') {
    if (inflationParams.yearlyInflationInTokens) {
      return 100 * calcInflationUniformEraPayout(totalIssuance, inflationParams.yearlyInflationInTokens);
    } else {
      return 100 * calcInflationRewardCurve(minInflation, stakedFraction, idealStake, idealInterest, falloff);
    }
  } else {
    return 100 * (minInflation + (
      stakedFraction <= idealStake
        ? (stakedFraction * (idealInterest - (minInflation / idealStake)))
        : calcInflationRewardCurve(minInflation, stakedFraction, idealStake, idealInterest, falloff)
    ));
  }
}

export function calculateChainStakedReturn (inflation: number, totalEraStake: number, totalIssuance: number, networkKey: string) {
  const stakedFraction = totalEraStake / totalIssuance;
  let stakedReturn = inflation / stakedFraction;

  if (networkKey === 'aleph') {
    stakedReturn *= 0.9; // 10% goes to treasury
  }

  return stakedReturn;
}

export function calculateValidatorStakedReturn (chainStakedReturn: number, totalValidatorStake: number, avgStake: number, commission: number) {
  const adjusted = (avgStake * 100 * chainStakedReturn) / totalValidatorStake;

  const stakedReturn = (adjusted > Number.MAX_SAFE_INTEGER ? Number.MAX_SAFE_INTEGER : adjusted) / 100;

  return stakedReturn * (100 - commission) / 100; // Deduct commission
}

export function getCommission (commissionString: string) {
  return parseFloat(commissionString.split('%')[0]); // Example: 12%
}
