// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, BasicTxInfo, ChainBondingBasics, DelegationItem, NetworkJson, StakingType, UnlockingStakeInfo, ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import { ERA_LENGTH_MAP } from '@subwallet/extension-koni-base/api/bonding/utils';
import { getFreeBalance } from '@subwallet/extension-koni-base/api/dotsama/balance';
import { parseNumberToDisplay, parseRawNumber } from '@subwallet/extension-koni-base/utils';
import Web3 from 'web3';

import { BN } from '@polkadot/util';

// interface InflationConfig {
//   collator: {
//     maxRate: string,
//     rewardRate: {
//       annual: string,
//       perBlock: string
//     }
//   },
//   delegator: {
//     maxRate: string,
//     rewardRate: {
//       annual: string,
//       perBlock: string
//     }
//   }
// }

interface CollatorInfo {
  id: string,
  stake: string,
  delegators: any[],
  total: string,
  status: string
}

export async function getAmplitudeBondingBasics (networkKey: string, dotSamaApi: ApiProps) {
  const apiProps = await dotSamaApi.isReady;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_totalStake, _totalIssuance, _inflation, _allCollators] = await Promise.all([
    apiProps.api.query.parachainStaking.totalCollatorStake(),
    apiProps.api.query.balances.totalIssuance(),
    apiProps.api.query.parachainStaking.inflationConfig(),
    apiProps.api.query.parachainStaking.candidatePool.entries()
  ]);

  // const totalStake = _totalStake ? new BN(_totalStake.toString()) : BN_ZERO;
  // const totalIssuance = new BN(_totalIssuance.toString());
  //
  // const inflationConfig = _inflation.toHuman() as unknown as InflationConfig;

  return {
    isMaxNominators: false,
    stakedReturn: 0,
    validatorCount: _allCollators.length
  } as ChainBondingBasics;
}

export async function getAmplitudeCollatorsInfo (networkKey: string, dotSamaApi: ApiProps, decimals: number, address: string) {
  const apiProps = await dotSamaApi.isReady;

  const [_allCollators, _delegatorState] = await Promise.all([
    apiProps.api.query.parachainStaking.candidatePool.entries(),
    apiProps.api.query.parachainStaking.delegatorState(address)
  ]);

  const _maxDelegatorPerCandidate = apiProps.api.consts.parachainStaking.maxDelegatorsPerCollator.toHuman() as string;
  const maxDelegatorPerCandidate = parseRawNumber(_maxDelegatorPerCandidate);

  const _maxDelegationCount = apiProps.api.consts.parachainStaking.maxDelegationsPerRound.toHuman() as string;
  const maxDelegationCount = parseRawNumber(_maxDelegationCount);

  const _chainMinDelegation = apiProps.api.consts.parachainStaking.minDelegatorStake.toHuman() as string;
  const chainMinDelegation = parseRawNumber(_chainMinDelegation) / 10 ** decimals;

  const rawDelegatorState = _delegatorState.toHuman() as Record<string, string> | null;

  const allCollators: ValidatorInfo[] = [];

  for (const _collator of _allCollators) {
    const collatorInfo = _collator[1].toHuman() as unknown as CollatorInfo;

    if (collatorInfo.status.toLowerCase() === 'active') {
      allCollators.push({
        address: collatorInfo.id,
        totalStake: parseRawNumber(collatorInfo.total) / 10 ** decimals,
        ownStake: parseRawNumber(collatorInfo.stake) / 10 ** decimals,
        otherStake: (parseRawNumber(collatorInfo.total) - parseRawNumber(collatorInfo.stake)) / 10 ** decimals,

        nominatorCount: collatorInfo.delegators.length,
        commission: 0,
        expectedReturn: 0,
        blocked: false,
        isVerified: false,
        minBond: chainMinDelegation,
        isNominated: false
      });
    }
  }

  const bondedCollators: string[] = [];

  if (rawDelegatorState !== null) {
    Object.entries(rawDelegatorState).forEach(([key, value]) => {
      if (key === 'owner') {
        bondedCollators.push(value);
      }
    });
  }

  for (const collator of allCollators) {
    if (bondedCollators.includes(collator.address)) {
      collator.isNominated = true;
    }
  }

  return {
    maxNominatorPerValidator: maxDelegatorPerCandidate,
    era: -1,
    validatorsInfo: allCollators,
    isBondedBefore: rawDelegatorState !== null,
    bondedValidators: bondedCollators,
    maxNominations: maxDelegationCount
  };
}

export async function getAmplitudeBondingTxInfo (networkJson: NetworkJson, dotSamaApi: ApiProps, delegatorAddress: string, amount: number, collatorInfo: ValidatorInfo) {
  const apiPromise = await dotSamaApi.isReady;
  const parsedAmount = amount * (10 ** (networkJson.decimals as number));
  const binaryAmount = new BN(parsedAmount.toString());

  const rawDelegatorState = (await apiPromise.api.query.parachainStaking.delegatorState(delegatorAddress)).toHuman() as Record<string, string> | null;

  const bondedCollators: string[] = [];

  if (rawDelegatorState !== null) {
    Object.entries(rawDelegatorState).forEach(([key, value]) => {
      if (key === 'owner') {
        bondedCollators.push(value);
      }
    });
  }

  let extrinsic;

  if (!bondedCollators.includes(collatorInfo.address)) {
    extrinsic = apiPromise.api.tx.parachainStaking.joinDelegators(collatorInfo.address, binaryAmount);
  } else {
    extrinsic = apiPromise.api.tx.parachainStaking.delegatorStakeMore(collatorInfo.address, binaryAmount);
  }

  return extrinsic.paymentInfo(delegatorAddress);
}

export async function handleAmplitudeBondingTxInfo (networkJson: NetworkJson, amount: number, networkKey: string, nominatorAddress: string, validatorInfo: ValidatorInfo, dotSamaApiMap: Record<string, ApiProps>, web3ApiMap: Record<string, Web3>) {
  try {
    const [txInfo, balance] = await Promise.all([
      getAmplitudeBondingTxInfo(networkJson, dotSamaApiMap[networkKey], nominatorAddress, amount, validatorInfo),
      getFreeBalance(networkKey, nominatorAddress, dotSamaApiMap, web3ApiMap)
    ]);

    const feeString = parseNumberToDisplay(txInfo.partialFee, networkJson.decimals) + ` ${networkJson.nativeToken ? networkJson.nativeToken : ''}`;
    const rawFee = parseRawNumber(txInfo.partialFee.toString());
    const binaryBalance = new BN(balance);

    const sumAmount = txInfo.partialFee.addn(amount);
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
    } as BasicTxInfo;
  }
}

export async function getAmplitudeUnbondingTxInfo (networkJson: NetworkJson, dotSamaApi: ApiProps, address: string, amount: number, collatorAddress: string, unstakeAll: boolean) {
  const apiPromise = await dotSamaApi.isReady;
  const parsedAmount = amount * (10 ** (networkJson.decimals as number));
  const binaryAmount = new BN(parsedAmount.toString());

  let extrinsic;

  if (!unstakeAll) {
    extrinsic = apiPromise.api.tx.parachainStaking.delegatorStakeLess(collatorAddress, binaryAmount);
  } else {
    extrinsic = apiPromise.api.tx.parachainStaking.leaveDelegators();
  }

  return extrinsic.paymentInfo(address);
}

export async function handleAmplitudeUnbondingTxInfo (address: string, amount: number, networkKey: string, dotSamaApiMap: Record<string, ApiProps>, web3ApiMap: Record<string, Web3>, networkJson: NetworkJson, collatorAddress: string, unstakeAll: boolean) {
  try {
    const [txInfo, balance] = await Promise.all([
      getAmplitudeUnbondingTxInfo(networkJson, dotSamaApiMap[networkKey], address, amount, collatorAddress, unstakeAll),
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

export async function getAmplitudeBondingExtrinsic (delegatorAddress: string, networkJson: NetworkJson, dotSamaApi: ApiProps, amount: number, collatorInfo: ValidatorInfo) {
  const apiPromise = await dotSamaApi.isReady;
  const parsedAmount = amount * (10 ** (networkJson.decimals as number));
  const binaryAmount = new BN(parsedAmount.toString());
  const rawDelegatorState = (await apiPromise.api.query.parachainStaking.delegatorState(delegatorAddress)).toHuman() as Record<string, string> | null;

  const bondedCollators: string[] = [];

  if (rawDelegatorState !== null) {
    Object.entries(rawDelegatorState).forEach(([key, value]) => {
      if (key === 'owner') {
        bondedCollators.push(value);
      }
    });
  }

  if (!bondedCollators.includes(collatorInfo.address)) {
    return apiPromise.api.tx.parachainStaking.joinDelegators(collatorInfo.address, binaryAmount);
  } else {
    return apiPromise.api.tx.parachainStaking.delegatorStakeMore(collatorInfo.address, binaryAmount);
  }
}

export async function getAmplitudeUnbondingExtrinsic (dotSamaApi: ApiProps, amount: number, networkJson: NetworkJson, collatorAddress: string, unstakeAll: boolean) {
  const apiPromise = await dotSamaApi.isReady;
  const parsedAmount = amount * (10 ** (networkJson.decimals as number));
  const binaryAmount = new BN(parsedAmount.toString());

  if (!unstakeAll) {
    return apiPromise.api.tx.parachainStaking.delegatorStakeLess(collatorAddress, binaryAmount);
  } else {
    return apiPromise.api.tx.parachainStaking.leaveDelegators();
  }
}

export async function getAmplitudeDelegationInfo (dotSamaApi: ApiProps, address: string) {
  const apiProps = await dotSamaApi.isReady;
  const delegationsList: DelegationItem[] = [];

  const _chainMinDelegation = apiProps.api.consts.parachainStaking.minDelegatorStake.toHuman() as string;
  const chainMinDelegation = _chainMinDelegation.replaceAll(',', '');

  const [_delegatorState, _unstakingInfo] = await Promise.all([
    apiProps.api.query.parachainStaking.delegatorState(address),
    apiProps.api.query.parachainStaking.unstaking(address)
  ]);

  const delegationState = _delegatorState.toHuman() as Record<string, string> | null;
  const unstakingInfo = _unstakingInfo.toHuman() as Record<string, string> | null;

  if (delegationState !== null) {
    const owner = delegationState.owner;
    const activeStake = parseRawNumber(delegationState.amount);

    delegationsList.push({
      owner,
      amount: activeStake.toString(),
      minBond: chainMinDelegation,
      hasScheduledRequest: unstakingInfo !== null
    });
  }

  return delegationsList;
}

async function getAmplitudeUnlockingInfo (dotSamaApi: ApiProps, address: string, networkKey: string) {
  const apiProps = await dotSamaApi.isReady;

  const [_unstakingInfo, _stakingInfo, _currentBlockInfo] = await Promise.all([
    apiProps.api.query.parachainStaking.unstaking(address),
    apiProps.api.query.parachainStaking.delegatorState(address),
    apiProps.api.rpc.chain.getHeader()
  ]);

  const _blockPerRound = apiProps.api.consts.parachainStaking.defaultBlocksPerRound.toHuman() as string;
  const blockPerRound = parseFloat(_blockPerRound);

  const unstakingInfo = _unstakingInfo.toHuman() as Record<string, string> | null;
  const stakingInfo = _stakingInfo.toHuman() as Record<string, string>;
  const currentBlockInfo = _currentBlockInfo.toHuman() as Record<string, any>;
  const currentBlock = parseRawNumber(currentBlockInfo.number as string);

  if (unstakingInfo === null) {
    return {
      nextWithdrawal: 0,
      redeemable: 0,
      nextWithdrawalAmount: 0
    };
  }

  const _nextWithdrawalAmount = Object.values(unstakingInfo)[0].replaceAll(',', '');
  const _nextWithdrawalBlock = Object.keys(unstakingInfo)[0].replaceAll(',', '');

  const nextWithdrawalAmount = parseFloat(_nextWithdrawalAmount);
  const nextWithdrawalBlock = parseFloat(_nextWithdrawalBlock);

  const blockDuration = (ERA_LENGTH_MAP[networkKey] || ERA_LENGTH_MAP.default) / blockPerRound;

  const nextWithdrawal = (nextWithdrawalBlock - currentBlock) * blockDuration;
  const validatorAddress = stakingInfo.owner;

  return {
    nextWithdrawal: nextWithdrawal > 0 ? nextWithdrawal : 0,
    redeemable: nextWithdrawal <= 0 ? nextWithdrawalAmount : 0,
    nextWithdrawalAmount,
    validatorAddress
  };
}

export async function handleAmplitudeUnlockingInfo (dotSamaApi: ApiProps, networkJson: NetworkJson, networkKey: string, address: string, type: StakingType) {
  const { nextWithdrawal, nextWithdrawalAmount, redeemable, validatorAddress } = await getAmplitudeUnlockingInfo(dotSamaApi, address, networkKey);

  const parsedRedeemable = redeemable / (10 ** (networkJson.decimals as number));
  const parsedNextWithdrawalAmount = nextWithdrawalAmount / (10 ** (networkJson.decimals as number));

  return {
    address,
    chain: networkKey,
    type,

    nextWithdrawal,
    redeemable: parsedRedeemable,
    nextWithdrawalAmount: parsedNextWithdrawalAmount,
    validatorAddress
  } as UnlockingStakeInfo;
}
