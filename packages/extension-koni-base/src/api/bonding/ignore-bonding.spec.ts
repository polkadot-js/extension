// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PREDEFINED_NETWORKS } from '@subwallet/extension-koni-base/api/predefinedNetworks';
import { DOTSAMA_AUTO_CONNECT_MS } from '@subwallet/extension-koni-base/constants';
import { getCurrentProvider } from '@subwallet/extension-koni-base/utils/utils';

import { ApiPromise, WsProvider } from '@polkadot/api';
import { BN, BN_ZERO } from '@polkadot/util';

interface ValidatorInfo {
  address: string;
  totalStake: string;
  ownStake: string;
  otherStake: string;
  nominatorCount: number;
  commission: string;
  expectedReturn: number;
  blocked: boolean;
}

interface ValidatorExtraInfo {
  commission: string,
  blocked: false
}

jest.setTimeout(50000);

function parseBalanceString (decimals: number, balance: number, unit: string) {
  const unitThreshold = 1000000;
  const parsedBalance = (balance / 10 ** decimals);

  if (parsedBalance > unitThreshold) {
    return (parsedBalance / unitThreshold).toFixed(2).toString() + ' ' + `M${unit}`;
  } else {
    return parsedBalance.toString() + ' ' + unit;
  }
}

interface InflationParams {
  auctionAdjust: number;
  auctionMax: number;
  falloff: number;
  maxInflation: number;
  minInflation: number;
  stakeTarget: number;
  yearlyInflationInTokens?: number;
}

interface UniformEraPayoutInflationParams extends InflationParams {
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

function calcInflationUniformEraPayout (totalIssuance: number, yearlyInflationInTokens: number): number {
  const totalIssuanceInTokens = (totalIssuance / 1000000000) / 1000;

  return (totalIssuanceInTokens === 0 ? 0.0 : yearlyInflationInTokens / totalIssuanceInTokens);
}

function calcInflationRewardCurve (minInflation: number, stakedFraction: number, idealStake: number, idealInterest: number, falloff: number) {
  return (minInflation + (
    stakedFraction <= idealStake
      ? (stakedFraction * (idealInterest - (minInflation / idealStake)))
      : (((idealInterest * idealStake) - minInflation) * Math.pow(2, (idealStake - stakedFraction) / falloff))
  ));
}

function calculateInflation (totalEraStake: number, totalIssuance: number, numAuctions: number, networkKey: string) {
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

  console.log('stakedFraction', stakedFraction);
  console.log('idealStake', idealStake);
  console.log('stakeReturn', stakeReturn);
}

describe('test DotSama APIs', () => {
  test('test get Validator', async () => {
    const provider = new WsProvider(getCurrentProvider(PREDEFINED_NETWORKS.aleph), DOTSAMA_AUTO_CONNECT_MS);
    const api = new ApiPromise({ provider });
    const apiPromise = await api.isReady;

    const era = await apiPromise.query.staking.currentEra();
    const parsedEra = era.toString();

    const allValidators: string[] = [];
    const result: ValidatorInfo[] = [];
    let totalEraStake = 0;

    const [_eraStakers, _totalIssuance, _auctionCounter] = await Promise.all([
      apiPromise.query.staking.erasStakers.entries(parseInt(parsedEra)),
      apiPromise.query.balances.totalIssuance(),
      apiPromise.query.auctions?.auctionCounter()
    ]);

    const eraStakers = _eraStakers as any[];
    const totalIssuance = _totalIssuance.toHuman() as string;
    const numAuctions = _auctionCounter ? _auctionCounter.toHuman() as number : 0;
    const parsedTotalIssuance = parseFloat(totalIssuance.replaceAll(',', ''));

    for (const item of eraStakers) {
      const rawValidatorInfo = item[0].toHuman() as any[];
      const rawValidatorStat = item[1].toHuman() as Record<string, any>;

      const validatorAddress = rawValidatorInfo[1] as string;
      const rawTotalStake = rawValidatorStat.total as string;
      const rawOwnStake = rawValidatorStat.own as string;

      const parsedTotalStake = parseFloat(rawTotalStake.replaceAll(',', ''));

      totalEraStake += parsedTotalStake;
      const parsedOwnStake = parseFloat(rawOwnStake.replaceAll(',', ''));
      const otherStake = parsedTotalStake - parsedOwnStake;

      const totalStakeString = parseBalanceString(PREDEFINED_NETWORKS.polkadot.decimals, parsedTotalStake, PREDEFINED_NETWORKS.polkadot.nativeToken);
      const ownStakeString = parseBalanceString(PREDEFINED_NETWORKS.polkadot.decimals, parsedOwnStake, PREDEFINED_NETWORKS.polkadot.nativeToken);
      const otherStakeString = parseBalanceString(PREDEFINED_NETWORKS.polkadot.decimals, otherStake, PREDEFINED_NETWORKS.polkadot.nativeToken);

      let nominatorCount = 0;

      if ('others' in rawValidatorStat) {
        const others = rawValidatorStat.others as Record<string, any>[];

        nominatorCount = others.length;
      }

      allValidators.push(validatorAddress);

      result.push({
        address: validatorAddress,
        totalStake: totalStakeString,
        ownStake: ownStakeString,
        otherStake: otherStakeString,
        nominatorCount,
        commission: '',
        expectedReturn: 12,
        blocked: false
      });
    }

    const extraInfoMap: Record<string, ValidatorExtraInfo> = {};

    await Promise.all(allValidators.map(async (address) => {
      extraInfoMap[address] = (await apiPromise.query.staking.validators(address)).toHuman() as unknown as ValidatorExtraInfo;
    }));

    const inflation = calculateInflation(totalEraStake, parsedTotalIssuance, numAuctions, 'aleph');
    const stakeReturn = inflation / stakedFraction;
    // minInflation
    // maxInflation
    // idealStake
    //
    // Expected returns = inflation / (totalStaked / totalIssuance)
  });

  test('test get Returns', async () => {
    const provider = new WsProvider(getCurrentProvider(PREDEFINED_NETWORKS.polkadot), DOTSAMA_AUTO_CONNECT_MS);
    const api = new ApiPromise({ provider });
    const apiProps = await api.isReady;

    const electedInfo = await apiProps.derive.staking.electedInfo({ withController: true, withExposure: true, withPrefs: true });
    const emptyExposure = api.createType('Exposure');
    // console.log(electedInfo);
    const count = 0;
    const list = electedInfo.info.map(({ accountId, exposure = emptyExposure, stakingLedger, validatorPrefs }): ValidatorInfo => {
      console.log(exposure.total.unwrap().toHuman());
      // some overrides (e.g. Darwinia Crab) does not have the own/total field in Exposure
      // let [bondOwn, bondTotal] = exposure.total
      //   ? [exposure.own.unwrap(), exposure.total.unwrap()]
      //   : [BN_ZERO, BN_ZERO];
      // const skipRewards = bondTotal.isZero();
      // // some overrides (e.g. Darwinia Crab) does not have the value field in IndividualExposure
      // const minNominated = (exposure.others || []).reduce((min: BN, {value = api.createType('Compact<Balance>')}): BN => {
      //   const actual = value.unwrap();
      //
      //   return min.isZero() || actual.lt(min)
      //     ? actual
      //     : min;
      // }, BN_ZERO);
      //
      // if (bondTotal.isZero()) {
      //   bondTotal = bondOwn = stakingLedger.total?.unwrap() || BN_ZERO;
      // }
    });
  });
});
