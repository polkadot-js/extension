// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, ChainBondingBasics, ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import { calculateChainStakedReturn, calculateInflation, calculateValidatorStakedReturn, ERA_LENGTH_MAP, getCommission, Unlocking, ValidatorExtraInfo } from '@subwallet/extension-koni-base/api/bonding/utils';

import { BN, BN_ONE, BN_ZERO } from '@polkadot/util';

export async function getChainBondingBasics (networkKey: string, dotSamaApi: ApiProps) {
  const apiProps = await dotSamaApi.isReady;

  const _era = await apiProps.api.query.staking.currentEra();
  const currentEra = _era.toString();

  const [_totalEraStake, _totalIssuance, _auctionCounter, _maxNominator, _nominatorCount] = await Promise.all([
    apiProps.api.query.staking.erasTotalStake(parseInt(currentEra)),
    apiProps.api.query.balances.totalIssuance(),
    apiProps.api.query.auctions?.auctionCounter(),
    apiProps.api.query.staking.maxNominatorsCount(),
    apiProps.api.query.staking.counterForNominators()
  ]);

  const rawMaxNominator = _maxNominator.toHuman() as string;
  const rawNominatorCount = _nominatorCount.toHuman() as string;
  const rawTotalEraStake = _totalEraStake.toHuman() as string;
  const rawTotalIssuance = _totalIssuance.toHuman() as string;
  const numAuctions = _auctionCounter ? _auctionCounter.toHuman() as number : 0;
  const totalIssuance = parseFloat(rawTotalIssuance.replaceAll(',', ''));
  const totalEraStake = parseFloat(rawTotalEraStake.replaceAll(',', ''));
  const maxNominator = parseFloat(rawMaxNominator.replaceAll(',', ''));
  const nominatorCount = parseFloat(rawNominatorCount.replaceAll(',', ''));

  const inflation = calculateInflation(totalEraStake, totalIssuance, numAuctions, networkKey);
  const stakedReturn = calculateChainStakedReturn(inflation, totalEraStake, totalIssuance, networkKey);

  return {
    isMaxNominators: nominatorCount >= maxNominator,
    stakedReturn
  } as ChainBondingBasics;
}

export async function getValidatorsInfo (networkKey: string, dotSamaApi: ApiProps, decimals: number, address: string) {
  const apiProps = await dotSamaApi.isReady;

  const _era = await apiProps.api.query.staking.currentEra();
  const currentEra = _era.toString();

  const allValidators: string[] = [];
  const result: ValidatorInfo[] = [];
  let totalEraStake = 0;

  const [_eraStakers, _totalIssuance, _auctionCounter, _minBond, _existedValidators, _bondedInfo] = await Promise.all([
    apiProps.api.query.staking.erasStakers.entries(parseInt(currentEra)),
    apiProps.api.query.balances.totalIssuance(),
    apiProps.api.query.auctions?.auctionCounter(),
    apiProps.api.query.staking.minNominatorBond(),
    apiProps.api.query.staking.nominators(address),
    apiProps.api.query.staking.bonded(address)
  ]);
  const rawMaxNominations = (apiProps.api.consts.staking.maxNominations).toHuman() as string;
  const maxNominations = parseFloat(rawMaxNominations.replaceAll(',', ''));
  const rawMaxNominatorPerValidator = (apiProps.api.consts.staking.maxNominatorRewardedPerValidator).toHuman() as string;
  const maxNominatorPerValidator = parseFloat(rawMaxNominatorPerValidator.replaceAll(',', ''));

  const bondedInfo = _bondedInfo.toHuman();
  const rawExistedValidators = _existedValidators.toHuman() as Record<string, any>;
  const bondedValidators = rawExistedValidators ? rawExistedValidators.targets as string[] : [];
  const eraStakers = _eraStakers as any[];
  const totalIssuance = _totalIssuance.toHuman() as string;
  const numAuctions = _auctionCounter ? _auctionCounter.toHuman() as number : 0;
  const parsedTotalIssuance = parseFloat(totalIssuance.replaceAll(',', ''));

  const rawMinBond = _minBond.toHuman() as string;
  const minBond = parseFloat(rawMinBond.replaceAll(',', ''));

  const totalStakeMap: Record<string, number> = {};

  for (const item of eraStakers) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    const rawValidatorInfo = item[0].toHuman() as any[];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    const rawValidatorStat = item[1].toHuman() as Record<string, any>;

    const validatorAddress = rawValidatorInfo[1] as string;
    const rawTotalStake = rawValidatorStat.total as string;
    const rawOwnStake = rawValidatorStat.own as string;

    const parsedTotalStake = parseFloat(rawTotalStake.replaceAll(',', ''));

    totalStakeMap[validatorAddress] = parsedTotalStake;

    totalEraStake += parsedTotalStake;
    const parsedOwnStake = parseFloat(rawOwnStake.replaceAll(',', ''));
    const otherStake = parsedTotalStake - parsedOwnStake;

    let nominatorCount = 0;

    if ('others' in rawValidatorStat) {
      const others = rawValidatorStat.others as Record<string, any>[];

      nominatorCount = others.length;
    }

    allValidators.push(validatorAddress);

    result.push({
      address: validatorAddress,
      totalStake: parsedTotalStake / 10 ** decimals,
      ownStake: parsedOwnStake / 10 ** decimals,
      otherStake: otherStake / 10 ** decimals,
      nominatorCount,
      // to be added later
      commission: 0,
      expectedReturn: 0,
      blocked: false,
      isVerified: false,
      minBond: (minBond / 10 ** decimals),
      isNominated: bondedValidators.includes(validatorAddress)
    } as ValidatorInfo);
  }

  const extraInfoMap: Record<string, ValidatorExtraInfo> = {};

  await Promise.all(allValidators.map(async (address) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const [_commissionInfo, _identityInfo] = await Promise.all([
      apiProps.api.query.staking.validators(address),
      apiProps.api.query?.identity?.identityOf(address)
    ]);

    const commissionInfo = _commissionInfo.toHuman() as Record<string, any>;
    const identityInfo = _identityInfo ? (_identityInfo.toHuman() as Record<string, any> | null) : null;
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

  const inflation = calculateInflation(totalEraStake, parsedTotalIssuance, numAuctions, networkKey);
  const stakedReturn = calculateChainStakedReturn(inflation, totalEraStake, parsedTotalIssuance, networkKey);
  const avgStake = totalEraStake / result.length;

  for (const validator of result) {
    const commission = extraInfoMap[validator.address].commission;

    validator.expectedReturn = calculateValidatorStakedReturn(stakedReturn, totalStakeMap[validator.address], avgStake, getCommission(commission));
    validator.commission = parseFloat(commission.split('%')[0]);
    validator.blocked = extraInfoMap[validator.address].blocked;
    validator.identity = extraInfoMap[validator.address].identity;
    validator.isVerified = extraInfoMap[validator.address].isVerified;
  }

  return {
    maxNominatorPerValidator,
    era: parseInt(currentEra),
    validatorsInfo: result,
    isBondedBefore: bondedInfo !== null,
    bondedValidators,
    maxNominations
  };
}

export async function getBondingTxInfo (dotSamaApi: ApiProps, controllerId: string, amount: BN, validators: string[], isBondedBefore: boolean, bondDest = 'Staked') {
  const apiPromise = await dotSamaApi.isReady;

  if (!isBondedBefore) {
    const bondTx = apiPromise.api.tx.staking.bond(controllerId, amount, bondDest);
    const nominateTx = apiPromise.api.tx.staking.nominate(validators);
    const extrinsic = apiPromise.api.tx.utility.batchAll([bondTx, nominateTx]);

    return extrinsic.paymentInfo(controllerId);
  } else {
    const bondTx = apiPromise.api.tx.staking.bondExtra(amount);
    const nominateTx = apiPromise.api.tx.staking.nominate(validators);
    const extrinsic = apiPromise.api.tx.utility.batchAll([bondTx, nominateTx]);

    return extrinsic.paymentInfo(controllerId);
  }
}

export async function getBondingExtrinsic (dotSamaApi: ApiProps, controllerId: string, amount: BN, validators: string[], isBondedBefore: boolean, bondDest = 'Staked') {
  const apiPromise = await dotSamaApi.isReady;

  let bondTx;
  const nominateTx = apiPromise.api.tx.staking.nominate(validators);

  if (!isBondedBefore) {
    bondTx = apiPromise.api.tx.staking.bond(controllerId, amount, bondDest);
  } else {
    bondTx = apiPromise.api.tx.staking.bondExtra(amount);
  }

  return apiPromise.api.tx.utility.batchAll([bondTx, nominateTx]);
}

export function getTargetValidators (bondedValidators: string[], selectedValidator: string) {
  if (bondedValidators.length === 0) {
    return [selectedValidator];
  } else {
    if (bondedValidators.includes(selectedValidator)) {
      return bondedValidators;
    } else {
      return [selectedValidator, ...bondedValidators];
    }
  }
}

export async function getUnbondingTxInfo (dotSamaApi: ApiProps, amount: BN, address: string) {
  const apiPromise = await dotSamaApi.isReady;

  const chillTx = apiPromise.api.tx.staking.chill();
  const unbondTx = apiPromise.api.tx.staking.unbond(amount);

  const extrinsic = apiPromise.api.tx.utility.batchAll([chillTx, unbondTx]);

  return extrinsic.paymentInfo(address);
}

export async function getUnbondingExtrinsic (dotSamaApi: ApiProps, amount: BN) {
  const apiPromise = await dotSamaApi.isReady;

  const chillTx = apiPromise.api.tx.staking.chill();
  const unbondTx = apiPromise.api.tx.staking.unbond(amount);

  return apiPromise.api.tx.utility.batchAll([chillTx, unbondTx]);
}

export async function getUnlockingInfo (dotSamaApi: ApiProps, address: string, networkKey: string) {
  const apiPromise = await dotSamaApi.isReady;

  const [stakingInfo, progress] = await Promise.all([
    apiPromise.api.derive.staking.account(address),
    apiPromise.api.derive.session.progress()
  ]);

  // @ts-ignore
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

  // Only get the nearest redeemable
  let minRemainingEra = BN_ZERO;
  let nextWithdrawalAmount = BN_ZERO;

  mapped.forEach(([{ value }, eras]) => {
    if (minRemainingEra === BN_ZERO) {
      minRemainingEra = eras;
      nextWithdrawalAmount = value;
    } else if (eras.lt(minRemainingEra)) {
      minRemainingEra = eras;
      nextWithdrawalAmount = value;
    } else if (eras.eq(minRemainingEra)) {
      nextWithdrawalAmount = nextWithdrawalAmount.add(value);
    }
  });

  return {
    nextWithdrawal: minRemainingEra.muln(ERA_LENGTH_MAP[networkKey] | ERA_LENGTH_MAP.default),
    redeemable: stakingInfo.redeemable,
    nextWithdrawalAmount
  };
}

export async function getWithdrawalTxInfo (dotSamaAPi: ApiProps, address: string) {
  const apiPromise = await dotSamaAPi.isReady;

  if (apiPromise.api.tx.staking.withdrawUnbonded.meta.args.length === 1) {
    const slashingSpans = await apiPromise.api.query.staking.slashingSpans(address);
    const extrinsic = apiPromise.api.tx.staking.withdrawUnbonded(slashingSpans.toHuman());

    return extrinsic.paymentInfo(address);
  } else {
    const extrinsic = apiPromise.api.tx.staking.withdrawUnbonded();

    return extrinsic.paymentInfo(address);
  }
}

export async function getWithdrawalExtrinsic (dotSamaAPi: ApiProps, address: string) {
  const apiPromise = await dotSamaAPi.isReady;

  if (apiPromise.api.tx.staking.withdrawUnbonded.meta.args.length === 1) {
    const slashingSpans = await apiPromise.api.query.staking.slashingSpans(address);

    return apiPromise.api.tx.staking.withdrawUnbonded(slashingSpans.toHuman());
  } else {
    return apiPromise.api.tx.staking.withdrawUnbonded();
  }
}
