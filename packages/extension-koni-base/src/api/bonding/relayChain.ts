// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, BasicTxInfo, ChainBondingBasics, NetworkJson, StakingType, UnlockingStakeInfo, ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import { calculateAlephZeroValidatorReturn, calculateChainStakedReturn, calculateInflation, calculateValidatorStakedReturn, ERA_LENGTH_MAP, getCommission, Unlocking, ValidatorExtraInfo } from '@subwallet/extension-koni-base/api/bonding/utils';
import { getFreeBalance } from '@subwallet/extension-koni-base/api/dotsama/balance';
import { parseNumberToDisplay, parseRawNumber } from '@subwallet/extension-koni-base/utils';
import Web3 from 'web3';

import { BN, BN_ONE, BN_ZERO } from '@polkadot/util';

export async function getRelayChainBondingBasics (networkKey: string, dotSamaApi: ApiProps) {
  const apiProps = await dotSamaApi.isReady;
  const _era = await apiProps.api.query.staking.currentEra();
  const currentEra = _era.toString();

  const [_totalEraStake, _totalIssuance, _auctionCounter, _maxNominator, _nominatorCount, _eraStakers] = await Promise.all([
    apiProps.api.query.staking.erasTotalStake(parseInt(currentEra)),
    apiProps.api.query.balances.totalIssuance(),
    apiProps.api.query.auctions?.auctionCounter(),
    apiProps.api.query.staking.maxNominatorsCount(),
    apiProps.api.query.staking.counterForNominators(),
    apiProps.api.query.staking.erasStakers.entries(parseInt(currentEra))
  ]);

  const eraStakers = _eraStakers as any[];

  const rawMaxNominator = _maxNominator.toHuman() as string;
  const rawNominatorCount = _nominatorCount.toHuman() as string;

  const rawTotalEraStake = _totalEraStake.toString();
  const rawTotalIssuance = _totalIssuance.toString();

  const numAuctions = _auctionCounter ? _auctionCounter.toHuman() as number : 0;

  const bnTotalEraStake = new BN(rawTotalEraStake);
  const bnTotalIssuance = new BN(rawTotalIssuance);

  const maxNominator = rawMaxNominator !== null ? parseFloat(rawMaxNominator.replaceAll(',', '')) : -1;
  const nominatorCount = parseFloat(rawNominatorCount.replaceAll(',', ''));

  const inflation = calculateInflation(bnTotalEraStake, bnTotalIssuance, numAuctions, networkKey);
  const stakedReturn = calculateChainStakedReturn(inflation, bnTotalEraStake, bnTotalIssuance, networkKey);

  return {
    isMaxNominators: maxNominator !== -1 ? nominatorCount >= maxNominator : false,
    stakedReturn,
    validatorCount: eraStakers.length
  } as ChainBondingBasics;
}

export async function getRelayValidatorsInfo (networkKey: string, dotSamaApi: ApiProps, decimals: number, address: string) {
  const apiProps = await dotSamaApi.isReady;

  const _era = await apiProps.api.query.staking.currentEra();
  const currentEra = _era.toString();

  const allValidators: string[] = [];
  const result: ValidatorInfo[] = [];

  const [_totalEraStake, _eraStakers, _totalIssuance, _auctionCounter, _minBond, _existedValidators, _bondedInfo] = await Promise.all([
    apiProps.api.query.staking.erasTotalStake(parseInt(currentEra)),
    apiProps.api.query.staking.erasStakers.entries(parseInt(currentEra)),
    apiProps.api.query.balances.totalIssuance(),
    apiProps.api.query.auctions?.auctionCounter(),
    apiProps.api.query.staking.minNominatorBond(),
    apiProps.api.query.staking.nominators(address),
    apiProps.api.query.staking.bonded(address)
  ]);

  const bnTotalEraStake = new BN(_totalEraStake.toString());
  const bnTotalIssuance = new BN(_totalIssuance.toString());

  const rawMaxNominations = (apiProps.api.consts.staking.maxNominations).toHuman() as string;
  const maxNominations = parseFloat(rawMaxNominations.replaceAll(',', ''));
  const rawMaxNominatorPerValidator = (apiProps.api.consts.staking.maxNominatorRewardedPerValidator).toHuman() as string;
  const maxNominatorPerValidator = parseFloat(rawMaxNominatorPerValidator.replaceAll(',', ''));

  const bondedInfo = _bondedInfo.toHuman();
  const rawExistedValidators = _existedValidators.toHuman() as Record<string, any>;
  const bondedValidators = rawExistedValidators ? rawExistedValidators.targets as string[] : [];
  const eraStakers = _eraStakers as any[];

  const numAuctions = _auctionCounter ? _auctionCounter.toHuman() as number : 0;
  const rawMinBond = _minBond.toHuman() as string;
  const minBond = parseFloat(rawMinBond.replaceAll(',', ''));

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

    result.push({
      address: validatorAddress,
      totalStake: bnTotalStake.div(bnDecimals).toNumber(),
      ownStake: bnOwnStake.div(bnDecimals).toNumber(),
      otherStake: otherStake.div(bnDecimals).toNumber(),
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

  const inflation = calculateInflation(bnTotalEraStake, bnTotalIssuance, numAuctions, networkKey);
  const stakedReturn = calculateChainStakedReturn(inflation, bnTotalEraStake, bnTotalIssuance, networkKey);
  const bnAvgStake = bnTotalEraStake.divn(result.length).div(bnDecimals);

  for (const validator of result) {
    const commission = extraInfoMap[validator.address].commission;

    const bnStakedReturn = stakedReturn >= Infinity ? BN_ZERO : new BN(stakedReturn); // stakedReturn might be Infinity due to testnet params
    const bnValidatorStake = totalStakeMap[validator.address].div(bnDecimals);

    validator.expectedReturn = ['aleph', 'alephTest'].includes(networkKey) ? calculateAlephZeroValidatorReturn(stakedReturn, getCommission(commission)) : calculateValidatorStakedReturn(bnStakedReturn, bnValidatorStake, bnAvgStake, getCommission(commission));
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

export async function getRelayBondingTxInfo (dotSamaApi: ApiProps, controllerId: string, amount: BN, validators: string[], isBondedBefore: boolean, bondDest = 'Staked') {
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

export async function handleRelayBondingTxInfo (networkJson: NetworkJson, amount: number, targetValidators: string[], isBondedBefore: boolean, networkKey: string, nominatorAddress: string, dotSamaApiMap: Record<string, ApiProps>, web3ApiMap: Record<string, Web3>) {
  try {
    const parsedAmount = amount * (10 ** (networkJson.decimals as number));
    const binaryAmount = new BN(parsedAmount.toString());
    const [txInfo, balance] = await Promise.all([
      getRelayBondingTxInfo(dotSamaApiMap[networkKey], nominatorAddress, binaryAmount, targetValidators, isBondedBefore),
      getFreeBalance(networkKey, nominatorAddress, dotSamaApiMap, web3ApiMap)
    ]);

    const feeString = parseNumberToDisplay(txInfo.partialFee, networkJson.decimals) + ` ${networkJson.nativeToken ? networkJson.nativeToken : ''}`;
    const rawFee = parseRawNumber(txInfo.partialFee.toString());
    const binaryBalance = new BN(balance);

    const sumAmount = txInfo.partialFee.add(binaryAmount);
    const balanceError = sumAmount.gt(binaryBalance);

    return {
      rawFee,
      fee: feeString,
      balanceError
    } as BasicTxInfo;
  } catch (e) {
    return {
      fee: `0.0000 ${networkJson.nativeToken as string}`,
      balanceError: false
    };
  }
}

export async function getRelayBondingExtrinsic (dotSamaApi: ApiProps, controllerId: string, amount: number, validators: string[], isBondedBefore: boolean, networkJson: NetworkJson, bondDest = 'Staked') {
  const apiPromise = await dotSamaApi.isReady;
  const parsedAmount = amount * (10 ** (networkJson.decimals as number));
  const binaryAmount = new BN(parsedAmount.toString());

  let bondTx;
  const nominateTx = apiPromise.api.tx.staking.nominate(validators);

  if (!isBondedBefore) {
    bondTx = apiPromise.api.tx.staking.bond(controllerId, binaryAmount, bondDest);
  } else {
    bondTx = apiPromise.api.tx.staking.bondExtra(binaryAmount);
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

export async function getRelayUnbondingTxInfo (dotSamaApi: ApiProps, amount: BN, address: string) {
  const apiPromise = await dotSamaApi.isReady;

  const chillTx = apiPromise.api.tx.staking.chill();
  const unbondTx = apiPromise.api.tx.staking.unbond(amount);

  const extrinsic = apiPromise.api.tx.utility.batchAll([chillTx, unbondTx]);

  return extrinsic.paymentInfo(address);
}

export async function getRelayUnbondingExtrinsic (dotSamaApi: ApiProps, amount: number, networkJson: NetworkJson) {
  const apiPromise = await dotSamaApi.isReady;
  const parsedAmount = Math.floor(amount * (10 ** (networkJson.decimals as number)));
  const binaryAmount = new BN(parsedAmount.toString());

  const chillTx = apiPromise.api.tx.staking.chill();
  const unbondTx = apiPromise.api.tx.staking.unbond(binaryAmount);

  return apiPromise.api.tx.utility.batchAll([chillTx, unbondTx]);
}

export async function handleRelayUnbondingTxInfo (address: string, amount: number, networkKey: string, dotSamaApiMap: Record<string, ApiProps>, web3ApiMap: Record<string, Web3>, networkJson: NetworkJson) {
  try {
    const dotSamaApi = dotSamaApiMap[networkKey];
    const parsedAmount = Math.floor(amount * (10 ** (networkJson.decimals as number)));
    const binaryAmount = new BN(parsedAmount.toString());

    const [txInfo, balance] = await Promise.all([
      getRelayUnbondingTxInfo(dotSamaApi, binaryAmount, address),
      getFreeBalance(networkKey, address, dotSamaApiMap, web3ApiMap)
    ]);

    const feeString = parseNumberToDisplay(txInfo.partialFee, networkJson.decimals) + ` ${networkJson.nativeToken ? networkJson.nativeToken : ''}`;
    const rawFee = parseRawNumber(txInfo.partialFee.toString());
    const binaryBalance = new BN(balance);

    const balanceError = txInfo.partialFee.gt(binaryBalance);

    return {
      rawFee,
      fee: feeString,
      balanceError
    } as BasicTxInfo;
  } catch (e) {
    return {
      fee: `0.0000 ${networkJson.nativeToken as string}`,
      balanceError: false
    } as BasicTxInfo;
  }
}

export async function getRelayUnlockingInfo (dotSamaApi: ApiProps, address: string, networkKey: string) {
  const apiPromise = await dotSamaApi.isReady;

  const [stakingInfo, progress] = await Promise.all([
    apiPromise.api.derive.staking.account(address),
    apiPromise.api.derive.session.progress()
  ]);

  // Only get the nearest redeemable
  let minRemainingEra = BN_ZERO;
  let nextWithdrawalAmount = BN_ZERO;

  if (stakingInfo.unlocking) {
    // @ts-ignore
    const mapped = stakingInfo.unlocking
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
  }

  return {
    nextWithdrawal: minRemainingEra.muln(ERA_LENGTH_MAP[networkKey] || ERA_LENGTH_MAP.default),
    redeemable: stakingInfo.redeemable,
    nextWithdrawalAmount
  };
}

export async function handleRelayUnlockingInfo (dotSamaApi: ApiProps, networkJson: NetworkJson, networkKey: string, address: string, type: StakingType) {
  const { nextWithdrawal, nextWithdrawalAmount, redeemable } = await getRelayUnlockingInfo(dotSamaApi, address, networkKey);

  const parsedRedeemable = redeemable ? parseFloat(redeemable.toString()) / (10 ** (networkJson.decimals as number)) : 0;
  const parsedNextWithdrawalAmount = parseFloat(nextWithdrawalAmount.toString()) / (10 ** (networkJson.decimals as number));

  return {
    chain: networkKey,
    address,
    type,

    nextWithdrawal: parseFloat(nextWithdrawal.toString()),
    redeemable: parsedRedeemable,
    nextWithdrawalAmount: parsedNextWithdrawalAmount
  } as UnlockingStakeInfo;
}

export async function getRelayWithdrawalTxInfo (dotSamaAPi: ApiProps, address: string) {
  const apiPromise = await dotSamaAPi.isReady;

  if (apiPromise.api.tx.staking.withdrawUnbonded.meta.args.length === 1) {
    const _slashingSpans = (await apiPromise.api.query.staking.slashingSpans(address)).toHuman() as Record<string, any>;
    const slashingSpanCount = _slashingSpans !== null ? _slashingSpans.spanIndex as string : '0';
    const extrinsic = apiPromise.api.tx.staking.withdrawUnbonded(slashingSpanCount);

    return extrinsic.paymentInfo(address);
  } else {
    const extrinsic = apiPromise.api.tx.staking.withdrawUnbonded();

    return extrinsic.paymentInfo(address);
  }
}

export async function handleRelayWithdrawalTxInfo (address: string, networkKey: string, networkJson: NetworkJson, dotSamaApiMap: Record<string, ApiProps>, web3ApiMap: Record<string, Web3>) {
  try {
    const [txInfo, balance] = await Promise.all([
      getRelayWithdrawalTxInfo(dotSamaApiMap[networkKey], address),
      getFreeBalance(networkKey, address, dotSamaApiMap, web3ApiMap)
    ]);

    const feeString = parseNumberToDisplay(txInfo.partialFee, networkJson.decimals) + ` ${networkJson.nativeToken ? networkJson.nativeToken : ''}`;
    const rawFee = parseRawNumber(txInfo.partialFee.toString());
    const binaryBalance = new BN(balance);
    const balanceError = txInfo.partialFee.gt(binaryBalance);

    return {
      rawFee,
      fee: feeString,
      balanceError
    } as BasicTxInfo;
  } catch (e) {
    console.error('Error estimating fee for staking withdrawal', e);

    return {
      fee: `0.0000 ${networkJson.nativeToken as string}`,
      balanceError: false
    } as BasicTxInfo;
  }
}

export async function getRelayWithdrawalExtrinsic (dotSamaAPi: ApiProps, address: string) {
  const apiPromise = await dotSamaAPi.isReady;

  if (apiPromise.api.tx.staking.withdrawUnbonded.meta.args.length === 1) {
    const _slashingSpans = (await apiPromise.api.query.staking.slashingSpans(address)).toHuman() as Record<string, any>;
    const slashingSpanCount = _slashingSpans !== null ? _slashingSpans.spanIndex as string : '0';

    return apiPromise.api.tx.staking.withdrawUnbonded(slashingSpanCount);
  } else {
    return apiPromise.api.tx.staking.withdrawUnbonded();
  }
}

async function getPoolingClaimRewardTxInfo (dotSamaApi: ApiProps, address: string) {
  const apiProps = await dotSamaApi.isReady;

  const extrinsic = apiProps.api.tx.nominationPools.claimPayout();

  return extrinsic.paymentInfo(address);
}

export async function handlePoolingClaimRewardTxInfo (address: string, networkKey: string, networkJson: NetworkJson, dotSamaApiMap: Record<string, ApiProps>, web3ApiMap: Record<string, Web3>) {
  try {
    const [txInfo, balance] = await Promise.all([
      getPoolingClaimRewardTxInfo(dotSamaApiMap[networkKey], address),
      getFreeBalance(networkKey, address, dotSamaApiMap, web3ApiMap)
    ]);

    const feeString = parseNumberToDisplay(txInfo.partialFee, networkJson.decimals) + ` ${networkJson.nativeToken ? networkJson.nativeToken : ''}`;
    const rawFee = parseRawNumber(txInfo.partialFee.toString());
    const binaryBalance = new BN(balance);
    const balanceError = txInfo.partialFee.gt(binaryBalance);

    return {
      rawFee,
      fee: feeString,
      balanceError
    } as BasicTxInfo;
  } catch (e) {
    console.error('Error handling nomination pool reward claiming', e);

    return {
      fee: `0.0000 ${networkJson.nativeToken as string}`,
      balanceError: false
    } as BasicTxInfo;
  }
}

export async function getPoolingClaimRewardExtrinsic (dotSamaApi: ApiProps) {
  const apiProps = await dotSamaApi.isReady;

  return apiProps.api.tx.nominationPools.claimPayout();
}
