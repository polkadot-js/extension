// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { BasicTxInfo, ChainBondingBasics, DelegationItem, StakingType, UnlockingStakeInfo, ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import { _STAKING_ERA_LENGTH_MAP } from '@subwallet/extension-base/services/chain-service/constants';
import { _EvmApi, _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getChainNativeTokenBasicInfo } from '@subwallet/extension-base/services/chain-service/utils';
import { getFreeBalance } from '@subwallet/extension-koni-base/api/dotsama/balance';
import { parseNumberToDisplay, parseRawNumber } from '@subwallet/extension-base/utils';

import { BN } from '@polkadot/util';

interface InflationConfig {
  collator: {
    maxRate: string,
    rewardRate: {
      annual: string,
      perBlock: string
    }
  },
  delegator: {
    maxRate: string,
    rewardRate: {
      annual: string,
      perBlock: string
    }
  }
}

interface CollatorInfo {
  id: string,
  stake: string,
  delegators: any[],
  total: string,
  status: string | Record<string, string>
}

export async function getAmplitudeBondingBasics (networkKey: string, substrateApi: _SubstrateApi) {
  const chainApi = await substrateApi.isReady;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_totalStake, _totalIssuance, _inflation, _allCollators] = await Promise.all([
    chainApi.api.query.parachainStaking.totalCollatorStake(),
    chainApi.api.query.balances.totalIssuance(),
    chainApi.api.query.parachainStaking.inflationConfig(),
    chainApi.api.query.parachainStaking.candidatePool.entries()
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

export async function getAmplitudeCollatorsInfo (networkKey: string, substrateApi: _SubstrateApi, decimals: number, address: string, extraCollatorAddress?: string) {
  const chainApi = await substrateApi.isReady;

  const [_allCollators, _delegatorState, _unstakingInfo, _inflationConfig] = await Promise.all([
    chainApi.api.query.parachainStaking.candidatePool.entries(),
    chainApi.api.query.parachainStaking.delegatorState(address),
    chainApi.api.query.parachainStaking.unstaking(address),
    chainApi.api.query.parachainStaking.inflationConfig()
  ]);

  const inflationConfig = _inflationConfig.toHuman() as unknown as InflationConfig;
  const rawDelegatorReturn = inflationConfig.delegator.rewardRate.annual;
  const delegatorReturn = parseFloat(rawDelegatorReturn.split('%')[0]);
  const _maxDelegatorPerCandidate = chainApi.api.consts.parachainStaking.maxDelegatorsPerCollator.toHuman() as string;
  const maxDelegatorPerCandidate = parseRawNumber(_maxDelegatorPerCandidate);

  const _maxDelegationCount = chainApi.api.consts.parachainStaking.maxDelegationsPerRound.toHuman() as string;
  const maxDelegationCount = parseRawNumber(_maxDelegationCount);

  const _chainMinDelegation = chainApi.api.consts.parachainStaking.minDelegatorStake.toHuman() as string;
  const chainMinDelegation = parseRawNumber(_chainMinDelegation) / 10 ** decimals;

  const delegatorState = _delegatorState.toHuman() as Record<string, string> | null;
  const unstakingInfo = _unstakingInfo.toHuman() as Record<string, string> | null;

  const allCollators: ValidatorInfo[] = [];

  for (const _collator of _allCollators) {
    const collatorInfo = _collator[1].toHuman() as unknown as CollatorInfo;

    if (typeof collatorInfo.status === 'string' && collatorInfo.status.toLowerCase() === 'active') {
      allCollators.push({
        address: collatorInfo.id,
        totalStake: parseRawNumber(collatorInfo.total) / 10 ** decimals,
        ownStake: parseRawNumber(collatorInfo.stake) / 10 ** decimals,
        otherStake: (parseRawNumber(collatorInfo.total) - parseRawNumber(collatorInfo.stake)) / 10 ** decimals,

        nominatorCount: collatorInfo.delegators.length,
        commission: 0,
        expectedReturn: delegatorReturn,
        blocked: false,
        isVerified: false,
        minBond: chainMinDelegation,
        isNominated: false
      });
    }
  }

  const bondedCollators: string[] = [];

  if (extraCollatorAddress) {
    bondedCollators.push(extraCollatorAddress);
  }

  if (delegatorState !== null) {
    Object.entries(delegatorState).forEach(([key, value]) => {
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

  if (unstakingInfo !== null && Object.values(unstakingInfo).length > 0) {
    for (const collator of allCollators) {
      if (bondedCollators.includes(collator.address)) {
        collator.hasScheduledRequest = true;
      }
    }
  }

  return {
    maxNominatorPerValidator: maxDelegatorPerCandidate,
    era: -1,
    validatorsInfo: allCollators,
    isBondedBefore: delegatorState !== null,
    bondedValidators: bondedCollators,
    maxNominations: maxDelegationCount
  };
}

export async function getAmplitudeBondingTxInfo (chainInfo: _ChainInfo, substrateApi: _SubstrateApi, delegatorAddress: string, amount: number, collatorInfo: ValidatorInfo) {
  const chainApi = await substrateApi.isReady;
  const { decimals } = _getChainNativeTokenBasicInfo(chainInfo);
  const parsedAmount = amount * (10 ** decimals);
  const binaryAmount = new BN(parsedAmount.toString());

  const rawDelegatorState = (await chainApi.api.query.parachainStaking.delegatorState(delegatorAddress)).toHuman() as Record<string, string> | null;

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
    extrinsic = chainApi.api.tx.parachainStaking.joinDelegators(collatorInfo.address, binaryAmount);
  } else {
    const _params = chainApi.api.tx.parachainStaking.delegatorStakeMore.toJSON() as Record<string, any>;
    const paramsCount = (_params.args as any[]).length;

    if (paramsCount === 2) {
      extrinsic = chainApi.api.tx.parachainStaking.delegatorStakeMore(collatorInfo.address, binaryAmount);
    } else {
      extrinsic = chainApi.api.tx.parachainStaking.delegatorStakeMore(binaryAmount);
    }
  }

  return extrinsic.paymentInfo(delegatorAddress);
}

export async function handleAmplitudeBondingTxInfo (chainInfo: _ChainInfo, amount: number, networkKey: string, nominatorAddress: string, validatorInfo: ValidatorInfo, substrateApiMap: Record<string, _SubstrateApi>, evmApiMap: Record<string, _EvmApi>) {
  const { decimals, symbol } = _getChainNativeTokenBasicInfo(chainInfo);

  try {
    const [txInfo, balance] = await Promise.all([
      getAmplitudeBondingTxInfo(chainInfo, substrateApiMap[networkKey], nominatorAddress, amount, validatorInfo),
      getFreeBalance(networkKey, nominatorAddress, substrateApiMap, evmApiMap)
    ]);

    const feeString = parseNumberToDisplay(txInfo.partialFee, decimals) + ` ${symbol}`;
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
      fee: `0.0000 ${symbol}`,
      balanceError: false
    } as BasicTxInfo;
  }
}

export async function getAmplitudeUnbondingTxInfo (chainInfo: _ChainInfo, substrateApi: _SubstrateApi, address: string, amount: number, collatorAddress: string, unstakeAll: boolean) {
  const apiPromise = await substrateApi.isReady;
  const { decimals } = _getChainNativeTokenBasicInfo(chainInfo);
  const parsedAmount = amount * (10 ** decimals);
  const binaryAmount = new BN(parsedAmount.toString());

  let extrinsic;

  if (!unstakeAll) {
    const _params = apiPromise.api.tx.parachainStaking.delegatorStakeMore.toJSON() as Record<string, any>;
    const paramsCount = (_params.args as any[]).length;

    if (paramsCount === 2) {
      extrinsic = apiPromise.api.tx.parachainStaking.delegatorStakeLess(collatorAddress, binaryAmount);
    } else {
      extrinsic = apiPromise.api.tx.parachainStaking.delegatorStakeLess(binaryAmount);
    }
  } else {
    extrinsic = apiPromise.api.tx.parachainStaking.leaveDelegators();
  }

  return extrinsic.paymentInfo(address);
}

export async function handleAmplitudeUnbondingTxInfo (address: string, amount: number, networkKey: string, substrateApiMap: Record<string, _SubstrateApi>, web3ApiMap: Record<string, _EvmApi>, chainInfo: _ChainInfo, collatorAddress: string, unstakeAll: boolean) {
  const { decimals, symbol } = _getChainNativeTokenBasicInfo(chainInfo);

  try {
    const [txInfo, balance] = await Promise.all([
      getAmplitudeUnbondingTxInfo(chainInfo, substrateApiMap[networkKey], address, amount, collatorAddress, unstakeAll),
      getFreeBalance(networkKey, address, substrateApiMap, web3ApiMap)
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

export async function getAmplitudeBondingExtrinsic (delegatorAddress: string, chainInfo: _ChainInfo, substrateApi: _SubstrateApi, amount: number, collatorInfo: ValidatorInfo) {
  const chainApi = await substrateApi.isReady;
  const { decimals } = _getChainNativeTokenBasicInfo(chainInfo);
  const parsedAmount = amount * (10 ** decimals);
  const binaryAmount = new BN(parsedAmount.toString());
  const rawDelegatorState = (await chainApi.api.query.parachainStaking.delegatorState(delegatorAddress)).toHuman() as Record<string, string> | null;

  const bondedCollators: string[] = [];

  if (rawDelegatorState !== null) {
    Object.entries(rawDelegatorState).forEach(([key, value]) => {
      if (key === 'owner') {
        bondedCollators.push(value);
      }
    });
  }

  if (!bondedCollators.includes(collatorInfo.address)) {
    return chainApi.api.tx.parachainStaking.joinDelegators(collatorInfo.address, binaryAmount);
  } else {
    const _params = chainApi.api.tx.parachainStaking.delegatorStakeMore.toJSON() as Record<string, any>;
    const paramsCount = (_params.args as any[]).length;

    if (paramsCount === 2) {
      return chainApi.api.tx.parachainStaking.delegatorStakeMore(collatorInfo.address, binaryAmount);
    } else {
      return chainApi.api.tx.parachainStaking.delegatorStakeMore(binaryAmount);
    }
  }
}

export async function getAmplitudeUnbondingExtrinsic (substrateApi: _SubstrateApi, amount: number, chainInfo: _ChainInfo, collatorAddress: string, unstakeAll: boolean) {
  const chainApi = await substrateApi.isReady;
  const { decimals } = _getChainNativeTokenBasicInfo(chainInfo);
  const parsedAmount = amount * (10 ** decimals);
  const binaryAmount = new BN(parsedAmount.toString());

  if (!unstakeAll) {
    const _params = chainApi.api.tx.parachainStaking.delegatorStakeMore.toJSON() as Record<string, any>;
    const paramsCount = (_params.args as any[]).length;

    if (paramsCount === 2) {
      return chainApi.api.tx.parachainStaking.delegatorStakeLess(collatorAddress, binaryAmount);
    } else {
      return chainApi.api.tx.parachainStaking.delegatorStakeLess(binaryAmount);
    }
  } else {
    return chainApi.api.tx.parachainStaking.leaveDelegators();
  }
}

export async function getAmplitudeDelegationInfo (substrateApi: _SubstrateApi, address: string) {
  const chainApi = await substrateApi.isReady;
  const delegationsList: DelegationItem[] = [];

  const _chainMinDelegation = chainApi.api.consts.parachainStaking.minDelegatorStake.toHuman() as string;
  const chainMinDelegation = _chainMinDelegation.replaceAll(',', '');

  const [_delegatorState, _unstakingInfo] = await Promise.all([
    chainApi.api.query.parachainStaking.delegatorState(address),
    chainApi.api.query.parachainStaking.unstaking(address)
  ]);

  const delegationState = _delegatorState.toHuman() as Record<string, any> | null;
  const unstakingInfo = _unstakingInfo.toHuman() as Record<string, string> | null;

  if (delegationState !== null) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const owner = delegationState.owner as string || delegationState.delegations[0].owner as string;
    const activeStake = parseRawNumber(delegationState.amount as string || delegationState.total as string);

    delegationsList.push({
      owner,
      amount: activeStake.toString(),
      minBond: chainMinDelegation,
      hasScheduledRequest: unstakingInfo !== null && Object.values(unstakingInfo).length > 0
    });
  }

  return delegationsList;
}

async function getAmplitudeUnlockingInfo (substrateApi: _SubstrateApi, address: string, networkKey: string, extraCollatorAddress: string) {
  const chainApi = await substrateApi.isReady;

  const [_unstakingInfo, _stakingInfo, _currentBlockInfo] = await Promise.all([
    chainApi.api.query.parachainStaking.unstaking(address),
    chainApi.api.query.parachainStaking.delegatorState(address),
    chainApi.api.rpc.chain.getHeader()
  ]);

  const _blockPerRound = chainApi.api.consts.parachainStaking.defaultBlocksPerRound.toHuman() as string;
  const blockPerRound = parseFloat(_blockPerRound);

  const unstakingInfo = _unstakingInfo.toHuman() as Record<string, string> | null;
  const stakingInfo = _stakingInfo.toHuman() as Record<string, string> | null;
  const currentBlockInfo = _currentBlockInfo.toHuman() as Record<string, any>;
  const currentBlock = parseRawNumber(currentBlockInfo.number as string);

  if (unstakingInfo === null || Object.values(unstakingInfo).length === 0) {
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

  const blockDuration = (_STAKING_ERA_LENGTH_MAP[networkKey] || _STAKING_ERA_LENGTH_MAP.default) / blockPerRound;

  const nextWithdrawal = (nextWithdrawalBlock - currentBlock) * blockDuration;
  const validatorAddress = stakingInfo !== null ? stakingInfo.owner : extraCollatorAddress;

  return {
    nextWithdrawal: nextWithdrawal > 0 ? nextWithdrawal : 0,
    redeemable: nextWithdrawal <= 0 ? nextWithdrawalAmount : 0,
    nextWithdrawalAmount,
    validatorAddress
  };
}

export async function handleAmplitudeUnlockingInfo (substrateApi: _SubstrateApi, chainInfo: _ChainInfo, networkKey: string, address: string, type: StakingType, extraCollatorAddress: string) {
  const { nextWithdrawal, nextWithdrawalAmount, redeemable, validatorAddress } = await getAmplitudeUnlockingInfo(substrateApi, address, networkKey, extraCollatorAddress);

  const { decimals } = _getChainNativeTokenBasicInfo(chainInfo);

  const parsedRedeemable = redeemable / (10 ** decimals);
  const parsedNextWithdrawalAmount = nextWithdrawalAmount / (10 ** decimals);

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

async function getAmplitudeWithdrawalTxInfo (substrateApi: _SubstrateApi, address: string) {
  const chainApi = await substrateApi.isReady;

  const extrinsic = chainApi.api.tx.parachainStaking.unlockUnstaked(address);

  return extrinsic.paymentInfo(address);
}

export async function handleAmplitudeWithdrawalTxInfo (networkKey: string, chainInfo: _ChainInfo, substrateApiMap: Record<string, _SubstrateApi>, evmApiMap: Record<string, _EvmApi>, address: string) {
  const { decimals, symbol } = _getChainNativeTokenBasicInfo(chainInfo);

  try {
    const [txInfo, balance] = await Promise.all([
      getAmplitudeWithdrawalTxInfo(substrateApiMap[networkKey], address),
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

export async function getAmplitudeWithdrawalExtrinsic (substrateApi: _SubstrateApi, address: string) {
  const chainApi = await substrateApi.isReady;

  return chainApi.api.tx.parachainStaking.unlockUnstaked(address);
}

async function getAmplitudeClaimRewardTxInfo (substrateApi: _SubstrateApi, address: string) {
  const chainApi = await substrateApi.isReady;

  const extrinsic = chainApi.api.tx.utility.batch([
    chainApi.api.tx.parachainStaking.incrementDelegatorRewards(),
    chainApi.api.tx.parachainStaking.claimRewards()
  ]);

  return extrinsic.paymentInfo(address);
}

export async function handleAmplitudeClaimRewardTxInfo (address: string, networkKey: string, chainInfo: _ChainInfo, substrateApiMap: Record<string, _SubstrateApi>, evmApiMap: Record<string, _EvmApi>) {
  const { decimals, symbol } = _getChainNativeTokenBasicInfo(chainInfo);

  try {
    const [txInfo, balance] = await Promise.all([
      getAmplitudeClaimRewardTxInfo(substrateApiMap[networkKey], address),
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

export async function getAmplitudeClaimRewardExtrinsic (substrateApi: _SubstrateApi) {
  const chainApi = await substrateApi.isReady;

  return chainApi.api.tx.utility.batch([
    chainApi.api.tx.parachainStaking.incrementDelegatorRewards(),
    chainApi.api.tx.parachainStaking.claimRewards()
  ]);
}
