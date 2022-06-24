// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, BasicTxInfo, ChainBondingBasics, NetworkJson, UnlockingStakeInfo, ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import { calculateChainStakedReturn, ERA_LENGTH_MAP, MOONBEAM_INFLATION_DISTRIBUTION, parseRawNumber } from '@subwallet/extension-koni-base/api/bonding/utils';
import { getFreeBalance } from '@subwallet/extension-koni-base/api/dotsama/balance';
import Web3 from 'web3';

import { BN } from '@polkadot/util';

interface CollatorExtraInfo {
  active: boolean,
  identity?: string,
  isVerified: boolean,
  delegationCount: number,
  bond: number,
  minDelegation: number
}

interface CollatorInfo {
  owner: string;
  amount: string;
}

export async function getMoonbeamBondingBasics (networkKey: string, dotSamaApi: ApiProps) {
  const apiProps = await dotSamaApi.isReady;

  const [_totalStake, _totalIssuance, _inflation] = await Promise.all([
    apiProps.api.query.parachainStaking.total(),
    apiProps.api.query.balances.totalIssuance(),
    apiProps.api.query.parachainStaking.inflationConfig()
  ]);

  const totalStake = _totalStake.toHuman() as string;
  const parsedTotalStake = parseFloat(totalStake.replaceAll(',', ''));

  const totalIssuance = _totalIssuance.toHuman() as string;
  const parsedTotalIssuance = parseFloat(totalIssuance.replaceAll(',', ''));

  const inflation = _inflation.toHuman() as Record<string, Record<string, any>>;
  const inflationString = inflation.annual.ideal as string;
  const parsedInflation = parseFloat(inflationString.split('%')[0]);
  const rewardPool = parsedInflation * MOONBEAM_INFLATION_DISTRIBUTION[networkKey].reward;

  const stakedReturn = calculateChainStakedReturn(rewardPool, parsedTotalStake, parsedTotalIssuance, networkKey);

  return {
    isMaxNominators: false,
    stakedReturn
  } as ChainBondingBasics;
}

export async function getMoonbeamCollatorsInfo (networkKey: string, dotSamaApi: ApiProps, decimals: number, address: string) {
  const apiProps = await dotSamaApi.isReady;

  const allValidators: ValidatorInfo[] = [];

  const [_allCollators, _delegatorState] = await Promise.all([
    apiProps.api.query.parachainStaking.candidatePool(),
    apiProps.api.query.parachainStaking.delegatorState(address)
  ]);

  const _maxDelegatorPerCandidate = apiProps.api.consts.parachainStaking.maxTopDelegationsPerCandidate.toHuman() as string;
  const maxDelegatorPerCandidate = parseRawNumber(_maxDelegatorPerCandidate);

  const _maxDelegation = apiProps.api.consts.parachainStaking.maxDelegationsPerDelegator.toHuman() as string;
  const maxDelegations = parseRawNumber(_maxDelegation);

  const rawDelegatorState = _delegatorState.toHuman() as Record<string, any> | null;
  const rawAllCollators = _allCollators.toHuman() as unknown as CollatorInfo[];

  for (const collator of rawAllCollators) {
    allValidators.push({
      address: collator.owner,
      totalStake: parseRawNumber(collator.amount) / 10 ** decimals,
      ownStake: 0,
      otherStake: 0,
      nominatorCount: 0,
      blocked: false,
      isVerified: false,
      minBond: 0,
      isNominated: false
    });
  }

  const bondedValidators: string[] = [];

  if (rawDelegatorState !== null) {
    const validatorList = rawDelegatorState.delegations as Record<string, any>[];

    for (const _validator of validatorList) {
      bondedValidators.push(_validator.owner as string);
    }
  }

  const extraInfoMap: Record<string, CollatorExtraInfo> = {};

  await Promise.all(allValidators.map(async (validator) => {
    const [_info, _identity] = await Promise.all([
      apiProps.api.query.parachainStaking.candidateInfo(validator.address),
      apiProps.api.query.identity.identityOf(validator.address)
    ]);

    const rawInfo = _info.toHuman() as Record<string, any>;
    const rawIdentity = _identity.toHuman() as Record<string, any> | null;

    const bond = parseRawNumber(rawInfo?.bond as string);
    const delegationCount = parseRawNumber(rawInfo?.delegationCount as string);
    const minDelegation = parseRawNumber(rawInfo?.lowestTopDelegationAmount as string);
    const active = rawInfo?.status === 'Active';

    let isReasonable = false;
    let identity;

    if (rawIdentity !== null) {
      // Check if identity is eth address
      const _judgements = rawIdentity.judgements as any[];

      if (_judgements.length > 0) {
        isReasonable = true;
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const displayName = rawIdentity?.info?.display?.Raw as string;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const legal = rawIdentity?.info?.legal?.Raw as string;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const web = rawIdentity?.info?.web?.Raw as string;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const riot = rawIdentity?.info?.riot?.Raw as string;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const email = rawIdentity?.info?.email?.Raw as string;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const twitter = rawIdentity?.info?.twitter?.Raw as string;

      if (displayName && !displayName.startsWith('0x')) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        identity = displayName;
      } else if (legal && !legal.startsWith('0x')) {
        identity = legal;
      } else {
        identity = twitter || web || email || riot;
      }
    }

    extraInfoMap[validator.address] = {
      identity,
      isVerified: isReasonable,
      bond: bond / 10 ** decimals,
      minDelegation: minDelegation / 10 ** decimals,
      delegationCount,
      active
    } as CollatorExtraInfo;
  }));

  for (const validator of allValidators) {
    if (bondedValidators.includes(validator.address)) {
      validator.isNominated = true;
    }

    validator.minBond = extraInfoMap[validator.address].minDelegation;
    validator.ownStake = extraInfoMap[validator.address].bond;
    validator.blocked = !extraInfoMap[validator.address].active;
    validator.identity = extraInfoMap[validator.address].identity;
    validator.isVerified = extraInfoMap[validator.address].isVerified;
    validator.otherStake = validator.totalStake - validator.ownStake;
    validator.nominatorCount = extraInfoMap[validator.address].delegationCount;
  }

  return {
    maxNominatorPerValidator: maxDelegatorPerCandidate,
    era: -1,
    validatorsInfo: allValidators,
    isBondedBefore: rawDelegatorState !== null,
    bondedValidators,
    maxNominations: maxDelegations
  };
}

export async function getMoonbeamBondingTxInfo (networkJson: NetworkJson, dotSamaApi: ApiProps, delegatorAddress: string, amount: number, collatorInfo: ValidatorInfo, currentNominationCount: number) {
  const apiPromise = await dotSamaApi.isReady;
  const parsedAmount = amount * (10 ** (networkJson.decimals as number));
  const binaryAmount = new BN(parsedAmount.toString());

  const extrinsic = apiPromise.api.tx.parachainStaking.delegate(collatorInfo.address, binaryAmount, new BN(collatorInfo.nominatorCount), new BN(currentNominationCount));

  return extrinsic.paymentInfo(delegatorAddress);
}

export async function handleMoonbeamBondingTxInfo (networkJson: NetworkJson, amount: number, networkKey: string, nominatorAddress: string, validatorInfo: ValidatorInfo, dotSamaApiMap: Record<string, ApiProps>, web3ApiMap: Record<string, Web3>, currentNominationCount: number) {
  const [txInfo, balance] = await Promise.all([
    getMoonbeamBondingTxInfo(networkJson, dotSamaApiMap[networkKey], nominatorAddress, amount, validatorInfo, currentNominationCount),
    getFreeBalance(networkKey, nominatorAddress, dotSamaApiMap, web3ApiMap)
  ]);

  const feeString = txInfo.partialFee.toHuman();
  const binaryBalance = new BN(balance);

  const sumAmount = txInfo.partialFee.addn(amount);
  const balanceError = sumAmount.gt(binaryBalance);

  return {
    fee: feeString,
    balanceError
  } as BasicTxInfo;
}

export async function getMoonbeamUnbondingTxInfo (networkJson: NetworkJson, dotSamaApi: ApiProps, address: string, amount: number, collatorAddress: string) {
  const apiPromise = await dotSamaApi.isReady;
  const parsedAmount = amount * (10 ** (networkJson.decimals as number));
  const binaryAmount = new BN(parsedAmount.toString());

  const extrinsic = apiPromise.api.tx.parachainStaking.scheduleDelegatorBondLess(collatorAddress, binaryAmount);

  return extrinsic.paymentInfo(address);
}

export async function handleMoonbeamUnbondingTxInfo (address: string, amount: number, networkKey: string, dotSamaApiMap: Record<string, ApiProps>, web3ApiMap: Record<string, Web3>, networkJson: NetworkJson, collatorAddress: string) {
  const [txInfo, balance] = await Promise.all([
    getMoonbeamUnbondingTxInfo(networkJson, dotSamaApiMap[networkKey], address, amount, collatorAddress),
    getFreeBalance(networkKey, address, dotSamaApiMap, web3ApiMap)
  ]);

  const feeString = txInfo.partialFee.toHuman();
  const binaryBalance = new BN(balance);

  const sumAmount = txInfo.partialFee.addn(amount);
  const balanceError = sumAmount.gt(binaryBalance);

  return {
    fee: feeString,
    balanceError
  } as BasicTxInfo;
}

export async function getMoonbeamBondingExtrinsic (networkJson: NetworkJson, dotSamaApi: ApiProps, amount: number, collatorInfo: ValidatorInfo, currentNominationCount: number) {
  const apiPromise = await dotSamaApi.isReady;
  const parsedAmount = amount * (10 ** (networkJson.decimals as number));
  const binaryAmount = new BN(parsedAmount.toString());

  return apiPromise.api.tx.parachainStaking.delegate(collatorInfo.address, binaryAmount, new BN(collatorInfo.nominatorCount), new BN(currentNominationCount));
}

export async function getMoonbeamUnbondingExtrinsic (dotSamaApi: ApiProps, amount: number, networkJson: NetworkJson, collatorAddress: string) {
  const apiPromise = await dotSamaApi.isReady;
  const parsedAmount = amount * (10 ** (networkJson.decimals as number));
  const binaryAmount = new BN(parsedAmount.toString());

  return apiPromise.api.tx.parachainStaking.scheduleDelegatorBondLess(collatorAddress, binaryAmount);
}

export async function getMoonbeamUnlockingInfo (dotSamaApi: ApiProps, address: string, networkKey: string, collatorList: string[]) {
  const apiPromise = await dotSamaApi.isReady;
  const allRequests: Record<string, Record<string, any>> = {};

  await Promise.all(collatorList.map(async (validator) => {
    const scheduledRequests = (await apiPromise.api.query.parachainStaking.delegationScheduledRequests(validator)).toHuman() as Record<string, any>[];

    scheduledRequests.forEach((request) => {
      if ((request.delegator as string).toLowerCase() === address.toLowerCase()) {
        const redeemRound = parseRawNumber(request.whenExecutable as string);
        let amount;
        let action;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (request.action.Revoke) {
          action = 'revoke';
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          amount = parseRawNumber(request.action.Revoke as string);
        } else {
          action = 'bondLess';
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          amount = parseRawNumber(request.action.Decrease as string);
        }

        allRequests[redeemRound.toString()] = {
          action,
          amount
        };
      }
    });
  }));

  let nextWithdrawalAmount = 0;
  let nextWithdrawalAction = '';
  let nextWithdrawalRound = 0;

  Object.entries(allRequests).forEach(([round, data]) => {
    if (nextWithdrawalRound === -1) {
      nextWithdrawalRound = parseFloat(round);
      nextWithdrawalAction = data.action as string;
      nextWithdrawalAmount = data.amount as number;
    } else if (nextWithdrawalRound > parseFloat(round)) {
      nextWithdrawalRound = parseFloat(round);
      nextWithdrawalAction = data.action as string;
      nextWithdrawalAmount = data.amount as number;
    }
  });

  const currentRoundInfo = (await apiPromise.api.query.parachainStaking.round()).toHuman() as Record<string, string>;
  const currentRound = parseRawNumber(currentRoundInfo.current);
  const nextWithdrawal = (currentRound - nextWithdrawalRound) * ERA_LENGTH_MAP[networkKey];

  return {
    nextWithdrawal,
    redeemable: nextWithdrawal === 0 ? nextWithdrawalAmount : 0,
    nextWithdrawalAmount,
    nextWithdrawalAction
  };
}

export async function handleMoonbeamUnlockingInfo (dotSamaApi: ApiProps, networkJson: NetworkJson, networkKey: string, address: string, collatorList: string[]) {
  const { nextWithdrawal, nextWithdrawalAction, nextWithdrawalAmount, redeemable } = await getMoonbeamUnlockingInfo(dotSamaApi, address, networkKey, collatorList);

  const parsedRedeemable = redeemable / (10 ** (networkJson.decimals as number));
  const parsedNextWithdrawalAmount = nextWithdrawalAmount / (10 ** (networkJson.decimals as number));

  return {
    nextWithdrawal,
    redeemable: parsedRedeemable,
    nextWithdrawalAmount: parsedNextWithdrawalAmount,
    nextWithdrawalAction
  } as UnlockingStakeInfo;
}
