// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, BasicTxInfo, NetworkJson, ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import { calculateChainStakedReturn, calculateInflation, calculateValidatorStakedReturn, getCommission, ValidatorExtraInfo } from '@subwallet/extension-koni-base/api/bonding/utils';
import { getFreeBalance } from '@subwallet/extension-koni-base/api/dotsama/balance';
import Web3 from 'web3';

import { BN } from '@polkadot/util';

export async function getDarwiniaValidatorsInfo (networkKey: string, dotSamaApi: ApiProps, decimals: number, address: string) {
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
    const rawTotalStake = rawValidatorStat.totalPower as string;
    const rawOwnStake = rawValidatorStat.ownPower as string;

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
      totalStake: parsedTotalStake,
      ownStake: parsedOwnStake,
      otherStake: otherStake,
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

      if (displayName && !displayName.startsWith('0x')) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        identity = displayName;
      } else if (legal && !legal.startsWith('0x')) {
        identity = legal;
      } else {
        identity = twitter || web || email || riot;
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

export async function getDarwiniaBondingTxInfo (dotSamaApi: ApiProps, controllerId: string, amount: BN, validators: string[], isBondedBefore: boolean, lockPeriod: number, bondDest = 'Staked') {
  const apiPromise = await dotSamaApi.isReady;

  if (!isBondedBefore) {
    const bondTx = apiPromise.api.tx.staking.bond(controllerId, { RingBalance: amount, KtonBalance: new BN(0) }, bondDest, new BN(lockPeriod.toString()));
    const nominateTx = apiPromise.api.tx.staking.nominate(validators);
    const extrinsic = apiPromise.api.tx.utility.batchAll([bondTx, nominateTx]);

    return extrinsic.paymentInfo(controllerId);
  } else {
    const bondTx = apiPromise.api.tx.staking.bondExtra({ RingBalance: amount, KtonBalance: new BN(0) }, new BN(lockPeriod.toString()));
    const nominateTx = apiPromise.api.tx.staking.nominate(validators);
    const extrinsic = apiPromise.api.tx.utility.batchAll([bondTx, nominateTx]);

    return extrinsic.paymentInfo(controllerId);
  }
}

export async function handleDarwiniaBondingTxInfo (networkJson: NetworkJson, amount: number, targetValidators: string[], isBondedBefore: boolean, networkKey: string, nominatorAddress: string, dotSamaApiMap: Record<string, ApiProps>, web3ApiMap: Record<string, Web3>, lockPeriod: number) {
  const parsedAmount = amount * (10 ** (networkJson.decimals as number));
  const binaryAmount = new BN(parsedAmount);
  const [txInfo, balance] = await Promise.all([
    getDarwiniaBondingTxInfo(dotSamaApiMap[networkKey], nominatorAddress, binaryAmount, targetValidators, isBondedBefore, lockPeriod),
    getFreeBalance(networkKey, nominatorAddress, dotSamaApiMap, web3ApiMap)
  ]);

  const feeString = txInfo.partialFee.toHuman();
  const binaryBalance = new BN(balance);

  const sumAmount = txInfo.partialFee.add(binaryAmount);
  const balanceError = sumAmount.gt(binaryBalance);

  return {
    fee: feeString,
    balanceError
  } as BasicTxInfo;
}

export async function getDarwiniaBondingExtrinsic (dotSamaApi: ApiProps, controllerId: string, amount: number, validators: string[], isBondedBefore: boolean, networkJson: NetworkJson, lockPeriod: number, bondDest = 'Staked') {
  const apiPromise = await dotSamaApi.isReady;
  const parsedAmount = amount * (10 ** (networkJson.decimals as number));
  const binaryAmount = new BN(parsedAmount);

  let bondTx;
  const nominateTx = apiPromise.api.tx.staking.nominate(validators);

  if (!isBondedBefore) {
    bondTx = apiPromise.api.tx.staking.bond(controllerId, { RingBalance: binaryAmount, KtonBalance: new BN(0) }, bondDest, new BN(lockPeriod.toString()));
  } else {
    bondTx = apiPromise.api.tx.staking.bondExtra({ RingBalance: binaryAmount, KtonBalance: new BN(0) }, new BN(lockPeriod.toString()));
  }

  return apiPromise.api.tx.utility.batchAll([bondTx, nominateTx]);
}
