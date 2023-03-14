// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { BasicTxInfo, ChainStakingMetadata, NominationInfo, NominatorMetadata, StakingType, UnlockingStakeInfo, UnstakingInfo, UnstakingStatus, ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import { _STAKING_CHAIN_GROUP, _STAKING_ERA_LENGTH_MAP } from '@subwallet/extension-base/services/chain-service/constants';
import { _EvmApi, _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getChainNativeTokenBasicInfo } from '@subwallet/extension-base/services/chain-service/utils';
import { parseNumberToDisplay, parseRawNumber } from '@subwallet/extension-base/utils';
import { getFreeBalance } from '@subwallet/extension-koni-base/api/dotsama/balance';
import { calculateAlephZeroValidatorReturn, calculateChainStakedReturn, calculateInflation, calculateValidatorStakedReturn, getCommission, PalletIdentityRegistration, parseIdentity, Unlocking, ValidatorExtraInfo } from '@subwallet/extension-koni-base/api/staking/bonding/utils';

import { BN, BN_ONE, BN_ZERO } from '@polkadot/util';
import { isEthereumAddress } from '@polkadot/util-crypto';

export interface PalletStakingNominations {
  targets: string[],
  submittedIn: number,
  suppressed: boolean
}

export interface UnlockingChunk {
  value: number,
  era: number
}

export interface PalletStakingStakingLedger {
  stash: string,
  total: number,
  active: number,
  unlocking: UnlockingChunk[],
  claimedRewards: number[]
}

export async function getRelayChainStakingMetadata (chain: string, substrateApi: _SubstrateApi): Promise<ChainStakingMetadata> {
  const chainApi = await substrateApi.isReady;
  const _era = await chainApi.api.query.staking.currentEra();
  const currentEra = _era.toString();
  const maxNominations = chainApi.api.consts.staking.maxNominations.toString();
  const maxUnlockingChunks = chainApi.api.consts.staking.maxUnlockingChunks.toString();
  const unlockingEras = chainApi.api.consts.staking.bondingDuration.toString();

  const [_totalEraStake, _totalIssuance, _auctionCounter, _minimumActiveStake] = await Promise.all([
    chainApi.api.query.staking.erasTotalStake(parseInt(currentEra)),
    chainApi.api.query.balances.totalIssuance(),
    chainApi.api.query.auctions?.auctionCounter(),
    chainApi.api.query.staking.minimumActiveStake()
  ]);

  const minStake = _minimumActiveStake.toString();

  const rawTotalEraStake = _totalEraStake.toString();
  const rawTotalIssuance = _totalIssuance.toString();

  const numAuctions = _auctionCounter ? _auctionCounter.toHuman() as number : 0;

  const bnTotalEraStake = new BN(rawTotalEraStake);
  const bnTotalIssuance = new BN(rawTotalIssuance);

  const inflation = calculateInflation(bnTotalEraStake, bnTotalIssuance, numAuctions, chain);
  const expectedReturn = calculateChainStakedReturn(inflation, bnTotalEraStake, bnTotalIssuance, chain);
  const unlockingPeriod = parseInt(unlockingEras) * _STAKING_ERA_LENGTH_MAP[chain]; // in hours

  return {
    chain,
    type: StakingType.NOMINATED,
    era: parseInt(currentEra),
    expectedReturn, // in %, annually
    inflation,
    minStake,
    maxValidatorPerNominator: parseInt(maxNominations),
    maxWithdrawalRequestPerValidator: parseInt(maxUnlockingChunks),
    allowCancelUnstaking: true,
    unstakingPeriod: unlockingPeriod
  } as ChainStakingMetadata;
}

export async function getRelayChainNominatorMetadata (chainInfo: _ChainInfo, address: string, substrateApi: _SubstrateApi): Promise<NominatorMetadata | undefined> {
  if (isEthereumAddress(address)) {
    return;
  }

  const chain = chainInfo.slug;
  const chainApi = await substrateApi.isReady;

  const [_ledger, _nominations, _currentEra] = await Promise.all([
    chainApi.api.query.staking.ledger(address),
    chainApi.api.query.staking.nominators(address),
    chainApi.api.query.staking.currentEra()
  ]);

  const ledger = _ledger.toJSON() as unknown as PalletStakingStakingLedger;
  const nominations = _nominations.toJSON() as unknown as PalletStakingNominations;
  const currentEra = _currentEra.toString();

  if (!ledger) {
    return;
  }

  const activeStake = ledger.active.toString();
  const nominationList: NominationInfo[] = [];
  const unstakingList: UnstakingInfo[] = [];

  if (nominations) {
    const validatorList = nominations.targets;

    await Promise.all(validatorList.map(async (validatorAddress) => {
      const identityInfo = (await chainApi.api.query.identity.identityOf(validatorAddress)).toHuman() as unknown as PalletIdentityRegistration;
      const identity = parseIdentity(identityInfo);

      nominationList.push({
        chain,
        validatorAddress,
        validatorIdentity: identity,
        activeStake: '0' // relaychain allocates stake accordingly
      } as NominationInfo);
    }));
  }

  ledger.unlocking.forEach((unlockingChunk) => {
    const isClaimable = unlockingChunk.era - parseInt(currentEra) <= 0;
    const remainingEra = unlockingChunk.era - (parseInt(currentEra) + 1);
    const waitingTime = remainingEra * _STAKING_ERA_LENGTH_MAP[chain];

    unstakingList.push({
      chain,
      status: isClaimable ? UnstakingStatus.CLAIMABLE : UnstakingStatus.UNLOCKING,
      claimable: unlockingChunk.value.toString(),
      waitingTime: waitingTime > 0 ? waitingTime : 0
    } as UnstakingInfo);
  });

  return {
    chain,
    type: StakingType.NOMINATED,
    address: address,
    activeStake,

    nominations: nominationList,
    unstakings: unstakingList
  } as NominatorMetadata;
}

export async function getRelayValidatorsInfo (chain: string, substrateApi: _SubstrateApi, decimals: number, chainStakingMetadata: ChainStakingMetadata): Promise<ValidatorInfo[]> {
  const chainApi = await substrateApi.isReady;

  const _era = await chainApi.api.query.staking.currentEra();
  const currentEra = _era.toString();

  const allValidators: string[] = [];
  const validatorInfoList: ValidatorInfo[] = [];

  const [_totalEraStake, _eraStakers, _minBond] = await Promise.all([
    chainApi.api.query.staking.erasTotalStake(parseInt(currentEra)),
    chainApi.api.query.staking.erasStakers.entries(parseInt(currentEra)),
    chainApi.api.query.staking.minNominatorBond()
  ]);

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

    validator.expectedReturn = _STAKING_CHAIN_GROUP.aleph.includes(chain)
      ? calculateAlephZeroValidatorReturn(chainStakingMetadata.expectedReturn as number, getCommission(commission))
      : calculateValidatorStakedReturn(chainStakingMetadata.expectedReturn as number, bnValidatorStake, bnAvgStake, getCommission(commission));
    validator.commission = parseFloat(commission.split('%')[0]);
    validator.blocked = extraInfoMap[validator.address].blocked;
    validator.identity = extraInfoMap[validator.address].identity;
    validator.isVerified = extraInfoMap[validator.address].isVerified;
  }

  return validatorInfoList;
}

export async function getRelayBondingTxInfo (substrateApi: _SubstrateApi, controllerId: string, amount: BN, validators: string[], isBondedBefore: boolean, bondDest = 'Staked') {
  const apiPromise = await substrateApi.isReady;

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

export async function handleRelayBondingTxInfo (chainInfo: _ChainInfo, amount: number, targetValidators: string[], isBondedBefore: boolean, networkKey: string, nominatorAddress: string, substrateApiMap: Record<string, _SubstrateApi>, evmApiMap: Record<string, _EvmApi>) {
  const { decimals, symbol } = _getChainNativeTokenBasicInfo(chainInfo);

  try {
    const parsedAmount = amount * (10 ** decimals);
    const binaryAmount = new BN(parsedAmount.toString());
    const [txInfo, balance] = await Promise.all([
      getRelayBondingTxInfo(substrateApiMap[networkKey], nominatorAddress, binaryAmount, targetValidators, isBondedBefore),
      getFreeBalance(networkKey, nominatorAddress, substrateApiMap, evmApiMap)
    ]);

    const feeString = parseNumberToDisplay(txInfo.partialFee, decimals) + ` ${symbol}`;
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
      fee: `0.0000 ${symbol}`,
      balanceError: false
    };
  }
}

export async function getRelayBondingExtrinsic (substrateApi: _SubstrateApi, controllerId: string, amount: number, validators: string[], isBondedBefore: boolean, chainInfo: _ChainInfo, bondDest = 'Staked') {
  const chainApi = await substrateApi.isReady;
  const { decimals } = _getChainNativeTokenBasicInfo(chainInfo);
  const parsedAmount = amount * (10 ** decimals);
  const binaryAmount = new BN(parsedAmount.toString());

  let bondTx;
  const nominateTx = chainApi.api.tx.staking.nominate(validators);

  if (!isBondedBefore) {
    bondTx = chainApi.api.tx.staking.bond(controllerId, binaryAmount, bondDest);
  } else {
    bondTx = chainApi.api.tx.staking.bondExtra(binaryAmount);
  }

  return chainApi.api.tx.utility.batchAll([bondTx, nominateTx]);
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

export async function getRelayUnbondingTxInfo (substrateApi: _SubstrateApi, amount: BN, address: string) {
  const chainApi = await substrateApi.isReady;

  const chillTx = chainApi.api.tx.staking.chill();
  const unbondTx = chainApi.api.tx.staking.unbond(amount);

  const extrinsic = chainApi.api.tx.utility.batchAll([chillTx, unbondTx]);

  return extrinsic.paymentInfo(address);
}

export async function getRelayUnbondingExtrinsic (substrateApi: _SubstrateApi, amount: number, chainInfo: _ChainInfo) {
  const chainApi = await substrateApi.isReady;
  const { decimals } = _getChainNativeTokenBasicInfo(chainInfo);
  const parsedAmount = Math.floor(amount * (10 ** decimals));
  const binaryAmount = new BN(parsedAmount.toString());

  const chillTx = chainApi.api.tx.staking.chill();
  const unbondTx = chainApi.api.tx.staking.unbond(binaryAmount);

  return chainApi.api.tx.utility.batchAll([chillTx, unbondTx]);
}

export async function handleRelayUnbondingTxInfo (address: string, amount: number, networkKey: string, substrateApiMap: Record<string, _SubstrateApi>, evmApiMap: Record<string, _EvmApi>, chainInfo: _ChainInfo) {
  const { decimals, symbol } = _getChainNativeTokenBasicInfo(chainInfo);

  try {
    const substrateApi = substrateApiMap[networkKey];
    const parsedAmount = Math.floor(amount * (10 ** decimals));
    const binaryAmount = new BN(parsedAmount.toString());

    const [txInfo, balance] = await Promise.all([
      getRelayUnbondingTxInfo(substrateApi, binaryAmount, address),
      getFreeBalance(networkKey, address, substrateApiMap, evmApiMap)
    ]);

    const feeString = parseNumberToDisplay(txInfo.partialFee, decimals) + ` ${symbol}`;
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
      fee: `0.0000 ${symbol}`,
      balanceError: false
    } as BasicTxInfo;
  }
}

export async function getRelayUnlockingInfo (substrateApi: _SubstrateApi, address: string, networkKey: string) {
  const chainApi = await substrateApi.isReady;

  const [stakingInfo, progress] = await Promise.all([
    chainApi.api.derive.staking.account(address),
    chainApi.api.derive.session.progress()
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
    nextWithdrawal: minRemainingEra.muln(_STAKING_ERA_LENGTH_MAP[networkKey] || _STAKING_ERA_LENGTH_MAP.default),
    redeemable: stakingInfo.redeemable,
    nextWithdrawalAmount
  };
}

export async function handleRelayUnlockingInfo (substrateApi: _SubstrateApi, chainInfo: _ChainInfo, networkKey: string, address: string, type: StakingType) {
  const { nextWithdrawal, nextWithdrawalAmount, redeemable } = await getRelayUnlockingInfo(substrateApi, address, networkKey);

  const { decimals } = _getChainNativeTokenBasicInfo(chainInfo);

  const parsedRedeemable = redeemable ? parseFloat(redeemable.toString()) / (10 ** decimals) : 0;
  const parsedNextWithdrawalAmount = parseFloat(nextWithdrawalAmount.toString()) / (10 ** decimals);

  return {
    chain: networkKey,
    address,
    type,

    nextWithdrawal: parseFloat(nextWithdrawal.toString()),
    redeemable: parsedRedeemable,
    nextWithdrawalAmount: parsedNextWithdrawalAmount
  } as UnlockingStakeInfo;
}

export async function getRelayWithdrawalTxInfo (substrateApi: _SubstrateApi, address: string) {
  const chainApi = await substrateApi.isReady;

  if (chainApi.api.tx.staking.withdrawUnbonded.meta.args.length === 1) {
    const _slashingSpans = (await chainApi.api.query.staking.slashingSpans(address)).toHuman() as Record<string, any>;
    const slashingSpanCount = _slashingSpans !== null ? _slashingSpans.spanIndex as string : '0';
    const extrinsic = chainApi.api.tx.staking.withdrawUnbonded(slashingSpanCount);

    return extrinsic.paymentInfo(address);
  } else {
    const extrinsic = chainApi.api.tx.staking.withdrawUnbonded();

    return extrinsic.paymentInfo(address);
  }
}

export async function handleRelayWithdrawalTxInfo (address: string, networkKey: string, chainInfo: _ChainInfo, substrateApiMap: Record<string, _SubstrateApi>, evmApiMap: Record<string, _EvmApi>) {
  const { decimals, symbol } = _getChainNativeTokenBasicInfo(chainInfo);

  try {
    const [txInfo, balance] = await Promise.all([
      getRelayWithdrawalTxInfo(substrateApiMap[networkKey], address),
      getFreeBalance(networkKey, address, substrateApiMap, evmApiMap)
    ]);

    const feeString = parseNumberToDisplay(txInfo.partialFee, decimals) + ` ${symbol}`;
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
      fee: `0.0000 ${symbol}`,
      balanceError: false
    } as BasicTxInfo;
  }
}

export async function getRelayWithdrawalExtrinsic (substrateApi: _SubstrateApi, address: string) {
  const chainApi = await substrateApi.isReady;

  if (chainApi.api.tx.staking.withdrawUnbonded.meta.args.length === 1) {
    const _slashingSpans = (await chainApi.api.query.staking.slashingSpans(address)).toHuman() as Record<string, any>;
    const slashingSpanCount = _slashingSpans !== null ? _slashingSpans.spanIndex as string : '0';

    return chainApi.api.tx.staking.withdrawUnbonded(slashingSpanCount);
  } else {
    return chainApi.api.tx.staking.withdrawUnbonded();
  }
}

async function getPoolingClaimRewardTxInfo (substrateApi: _SubstrateApi, address: string) {
  const chainApi = await substrateApi.isReady;

  const extrinsic = chainApi.api.tx.nominationPools.claimPayout();

  return extrinsic.paymentInfo(address);
}

export async function handlePoolingClaimRewardTxInfo (address: string, networkKey: string, chainInfo: _ChainInfo, substrateApiMap: Record<string, _SubstrateApi>, evmApiMap: Record<string, _EvmApi>) {
  const { decimals, symbol } = _getChainNativeTokenBasicInfo(chainInfo);

  try {
    const [txInfo, balance] = await Promise.all([
      getPoolingClaimRewardTxInfo(substrateApiMap[networkKey], address),
      getFreeBalance(networkKey, address, substrateApiMap, evmApiMap)
    ]);

    const feeString = parseNumberToDisplay(txInfo.partialFee, decimals) + ` ${symbol}`;
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
      fee: `0.0000 ${symbol}`,
      balanceError: false
    } as BasicTxInfo;
  }
}

export async function getPoolingClaimRewardExtrinsic (substrateApi: _SubstrateApi) {
  const chainApi = await substrateApi.isReady;

  return chainApi.api.tx.nominationPools.claimPayout();
}
