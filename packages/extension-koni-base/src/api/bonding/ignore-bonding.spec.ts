// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PREDEFINED_NETWORKS } from '@subwallet/extension-koni-base/api/predefinedNetworks';
import { DOTSAMA_AUTO_CONNECT_MS } from '@subwallet/extension-koni-base/constants';
import { getCurrentProvider } from '@subwallet/extension-koni-base/utils/utils';

import { ApiPromise, WsProvider } from '@polkadot/api';
import { Option } from '@polkadot/types';
import { SlashingSpans } from '@polkadot/types/interfaces';
import { BN, BN_ONE, BN_ZERO, bnMin, formatNumber } from '@polkadot/util';

jest.setTimeout(50000);

interface ValidatorInfo {
  rawTotalStake: number;
  address: string;
  totalStake: string;
  ownStake: string;
  otherStake: string;
  nominatorCount: number;
  commission: string;
  expectedReturn: number;
  blocked: boolean;
  identity?: string;
  isVerified: boolean;
}

interface Unlocking {
  remainingEras: BN;
  value: BN;
}

interface ValidatorExtraInfo {
  commission: string,
  blocked: false,
  identity?: string,
  isVerified: boolean
}

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
}

function calculateChainStakedReturn (inflation: number, totalEraStake: number, totalIssuance: number, networkKey: string) {
  const stakedFraction = totalEraStake / totalIssuance;
  let stakedReturn = inflation / stakedFraction;

  if (networkKey === 'aleph') {
    stakedReturn *= 0.9; // 10% goes to treasury
  }

  return stakedReturn;
}

function calculateValidatorStakedReturn (chainStakedReturn: number, totalValidatorStake: number, avgStake: number, commission: number) {
  const adjusted = (avgStake * 100 * chainStakedReturn) / totalValidatorStake;

  const stakedReturn = (adjusted > Number.MAX_SAFE_INTEGER ? Number.MAX_SAFE_INTEGER : adjusted) / 100;

  return stakedReturn * (100 - commission) / 100; // Deduct commission
}

function getCommission (commissionString: string) {
  return parseFloat(commissionString.split('%')[0]); // Example: 12%
}

describe('test DotSama APIs', () => {
  test('test get Validator', async () => {
    const provider = new WsProvider(getCurrentProvider(PREDEFINED_NETWORKS.westend), DOTSAMA_AUTO_CONNECT_MS);
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      const rawValidatorInfo = item[0].toHuman() as any[];
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      const rawValidatorStat = item[1].toHuman() as Record<string, any>;

      const validatorAddress = rawValidatorInfo[1] as string;
      const rawTotalStake = rawValidatorStat.total as string;
      const rawOwnStake = rawValidatorStat.own as string;

      const parsedTotalStake = parseFloat(rawTotalStake.replaceAll(',', ''));

      totalEraStake += parsedTotalStake;
      const parsedOwnStake = parseFloat(rawOwnStake.replaceAll(',', ''));
      const otherStake = parsedTotalStake - parsedOwnStake;

      // @ts-ignore
      const totalStakeString = parseBalanceString(PREDEFINED_NETWORKS.westend.decimals, parsedTotalStake, PREDEFINED_NETWORKS.westend.nativeToken);
      // @ts-ignore
      const ownStakeString = parseBalanceString(PREDEFINED_NETWORKS.westend.decimals, parsedOwnStake, PREDEFINED_NETWORKS.westend.nativeToken);
      // @ts-ignore
      const otherStakeString = parseBalanceString(PREDEFINED_NETWORKS.westend.decimals, otherStake, PREDEFINED_NETWORKS.westend.nativeToken);

      let nominatorCount = 0;

      if ('others' in rawValidatorStat) {
        const others = rawValidatorStat.others as Record<string, any>[];

        nominatorCount = others.length;
      }

      allValidators.push(validatorAddress);

      result.push({
        rawTotalStake: parsedTotalStake,
        address: validatorAddress,
        totalStake: totalStakeString,
        ownStake: ownStakeString,
        otherStake: otherStakeString,
        nominatorCount,
        // added later
        commission: '',
        expectedReturn: 0,
        blocked: false,
        isVerified: false
      });
    }

    const extraInfoMap: Record<string, ValidatorExtraInfo> = {};

    await Promise.all(allValidators.map(async (address) => {
      const [_commissionInfo, _identityInfo] = await Promise.all([
        apiPromise.query.staking.validators(address),
        apiPromise.query.identity.identityOf(address)
      ]);

      const commissionInfo = _commissionInfo.toHuman() as Record<string, any>;
      const identityInfo = _identityInfo.toHuman() as Record<string, any> | null;
      let isReasonable = false;
      let identity;

      if (identityInfo !== null) {
        // Check if identity is eth address
        const _judgements = identityInfo.judgements as any[];

        if (_judgements.length > 0) {
          isReasonable = true;
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const displayName = identityInfo?.info?.display?.Raw as string;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const legal = identityInfo?.info?.legal?.Raw as string;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const web = identityInfo?.info?.web?.Raw as string;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const riot = identityInfo?.info?.riot?.Raw as string;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const email = identityInfo?.info?.email?.Raw as string;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const twitter = identityInfo?.info?.twitter?.Raw as string;

        if (!displayName.startsWith('0x')) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          identity = identityInfo?.info?.display?.Raw as string;
        } else {
          identity = legal || twitter || web || email || riot;
        }
      }

      extraInfoMap[address] = {
        commission: commissionInfo.commission as string,
        blocked: commissionInfo.blocked as boolean,
        identity,
        isVerified: isReasonable
      } as ValidatorExtraInfo;
    }));

    const inflation = calculateInflation(totalEraStake, parsedTotalIssuance, numAuctions, 'westend');
    const stakedReturn = calculateChainStakedReturn(inflation, totalEraStake, parsedTotalIssuance, 'westend');
    const avgStake = totalEraStake / result.length;

    for (const validator of result) {
      const commission = extraInfoMap[validator.address].commission;

      validator.expectedReturn = calculateValidatorStakedReturn(stakedReturn, validator.rawTotalStake, avgStake, getCommission(commission));
      validator.commission = commission;
      validator.blocked = extraInfoMap[validator.address].blocked;
      validator.identity = extraInfoMap[validator.address].identity;
      validator.isVerified = extraInfoMap[validator.address].isVerified;
    }

    console.log(parsedEra);
    console.log(totalEraStake);
    console.log(result);
  });

  test('test bonding + nominating', async () => {
    const provider = new WsProvider(getCurrentProvider(PREDEFINED_NETWORKS.westend), DOTSAMA_AUTO_CONNECT_MS);
    const api = new ApiPromise({ provider });
    const apiPromise = await api.isReady;

    const controllerId = '5EsmjvZBNDjdTLGvCbr4CpUbxoQXi8meqZ83nEh1y9BBJ3ZG';
    const amount = new BN(1.1);
    const bondDest = 'Staked'; // pay into the stash account, increasing the amount at stake

    const bondTx = apiPromise.tx.staking.bond(controllerId, amount, bondDest);

    console.log(bondTx.toHuman());

    const nominateTx = api.tx.staking.nominate(['5GNy7frYA4BwWpKwxKAFWt4eBsZ9oAvXrp9SyDj6qzJAaNzB']);

    console.log(nominateTx.toHuman());

    const extrinsic = apiPromise.tx.utility.batchAll([bondTx, nominateTx]);

    console.log(extrinsic.toString());
  });

  test('get validators of nominator', async () => {
    const provider = new WsProvider(getCurrentProvider(PREDEFINED_NETWORKS.alephTest), DOTSAMA_AUTO_CONNECT_MS);
    const api = new ApiPromise({ provider });
    const apiPromise = await api.isReady;

    const resp = await apiPromise.query.staking.nominators('5GNy7frYA4BwWpKwxKAFWt4eBsZ9oAvXrp9SyDj6qzJAaNzB');
    const parsed = resp.toHuman() as Record<string, any>;

    console.log(parsed?.targets);
  });

  test('get unbonding', async () => {
    const provider = new WsProvider(getCurrentProvider(PREDEFINED_NETWORKS.alephTest), DOTSAMA_AUTO_CONNECT_MS);
    const api = new ApiPromise({ provider });
    const apiPromise = await api.isReady;

    const chillTx = apiPromise.tx.staking.chill();
    const unbondTx = apiPromise.tx.staking.unbond(new BN(100));

    const resp = apiPromise.tx.utility.batchAll([chillTx, unbondTx]);

    console.log(resp.toHuman());
  });

  test('get withdraw', async () => {
    const provider = new WsProvider(getCurrentProvider(PREDEFINED_NETWORKS.alephTest), DOTSAMA_AUTO_CONNECT_MS);
    const api = new ApiPromise({ provider });
    const apiPromise = await api.isReady;

    const stakingInfo = await apiPromise.derive.staking.account('5CXR5cKUySBJGksuLn2hbUTUMxm2uT9z3QWaU8Nmm4DG9Jhe');
    const slashingSpans = await apiPromise.query.staking.slashingSpans('5CXR5cKUySBJGksuLn2hbUTUMxm2uT9z3QWaU8Nmm4DG9Jhe');
    const progress = await apiPromise.derive.session.progress();

    console.log('slashingSpans', slashingSpans.toHuman());

    console.log('active', stakingInfo?.stakingLedger?.active.unwrap());
    console.log('redeemable', stakingInfo.redeemable);

    const mapped = stakingInfo?.unlocking
      .filter(({ remainingEras, value }) => value.gt(BN_ZERO) && remainingEras.gt(BN_ZERO))
      .map((unlock): [Unlocking, BN, BN] => [
        unlock,
        unlock.remainingEras,
        unlock.remainingEras
          .sub(BN_ONE)
          .imul(progress.eraLength)
          .iadd(progress.eraLength)
          .isub(progress.eraProgress)
      ]);
    const total = mapped.reduce((total, [{ value }]) => total.iadd(value), new BN(0));

    mapped.forEach(([{ value }, eras, blocks]) => {
      console.log(formatNumber(value));
      console.log(eras.toString());
      console.log(formatNumber(blocks));
    });

    // console.log(eraLength.mul(bondingDuration).toString());
  });

  test('withdraw', async () => {
    const provider = new WsProvider(getCurrentProvider(PREDEFINED_NETWORKS.alephTest), DOTSAMA_AUTO_CONNECT_MS);
    const api = new ApiPromise({ provider });
    const apiPromise = await api.isReady;

    console.log(apiPromise.tx.staking.withdrawUnbonded.meta.args.length === 1); // if true, then require slashingSpans

    const slashingSpans = await apiPromise.query.staking.slashingSpans('5CXR5cKUySBJGksuLn2hbUTUMxm2uT9z3QWaU8Nmm4DG9Jhe');

    console.log(slashingSpans.toHuman());

    const tx = apiPromise.tx.staking.withdrawUnbonded(slashingSpans.toHuman());

    console.log(tx.toHuman());
  });

  test('get staking', async () => {
    const provider = new WsProvider(getCurrentProvider(PREDEFINED_NETWORKS.alephTest), DOTSAMA_AUTO_CONNECT_MS);
    const api = new ApiPromise({ provider });
    const apiPromise = await api.isReady;

    const resp = await apiPromise.query.staking?.ledger.multi(['5CXR5cKUySBJGksuLn2hbUTUMxm2uT9z3QWaU8Nmm4DG9Jhe']);

    console.log(resp[0].toHuman());
  });
});
