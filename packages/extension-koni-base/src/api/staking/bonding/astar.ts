// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { BasicTxInfo, ChainStakingMetadata, DelegationItem, NominationInfo, NominatorMetadata, StakingType, UnlockingStakeInfo, UnstakingInfo, UnstakingStatus, ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import { _STAKING_ERA_LENGTH_MAP } from '@subwallet/extension-base/services/chain-service/constants';
import { _EvmApi, _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getChainNativeTokenBasicInfo } from '@subwallet/extension-base/services/chain-service/utils';
import { isUrl, parseNumberToDisplay, parseRawNumber } from '@subwallet/extension-base/utils';
import { getFreeBalance } from '@subwallet/extension-koni-base/api/dotsama/balance';
import { PalletDappsStakingAccountLedger, PalletDappsStakingDappInfo } from '@subwallet/extension-koni-base/api/staking/bonding/utils';
import fetch from 'cross-fetch';

import { SubmittableExtrinsic } from '@polkadot/api/promise/types';
import { BN, BN_ZERO } from '@polkadot/util';
import { isEthereumAddress } from '@polkadot/util-crypto';

export async function getAstarStakingMetadata (chain: string, substrateApi: _SubstrateApi): Promise<ChainStakingMetadata> {
  const aprPromise = new Promise(function (resolve) {
    fetch(`https://api.astar.network/api/v1/${chain}/dapps-staking/apr`, {
      method: 'GET'
    }).then((resp) => {
      resolve(resp.json());
    }).catch(console.error);
  });

  const timeout = new Promise((resolve) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      resolve(null);
    }, 8000);
  });

  const aprRacePromise = Promise.race([
    timeout,
    aprPromise
  ]); // need race because API often timeout

  const [aprInfo, chainApi] = await Promise.all([
    aprRacePromise,
    substrateApi.isReady
  ]);

  const era = (await chainApi.api.query.dappsStaking.currentEra()).toString();
  const minDelegatorStake = chainApi.api.consts.dappsStaking.minimumStakingAmount.toString();
  const unstakingDelay = chainApi.api.consts.dappsStaking.unbondingPeriod.toString();

  const unstakingPeriod = parseInt(unstakingDelay) * _STAKING_ERA_LENGTH_MAP[chain];

  return {
    chain,
    type: StakingType.NOMINATED,
    expectedReturn: aprInfo !== null ? aprInfo as number : undefined,
    era: parseInt(era),
    minStake: minDelegatorStake,
    maxValidatorPerNominator: 100, // temporary fix for Astar, there's no limit for now
    maxWithdrawalRequestPerValidator: 1, // by default
    allowCancelUnstaking: true,
    unstakingPeriod
  } as ChainStakingMetadata;
}

export async function getAstarNominatorMetadata (chainInfo: _ChainInfo, address: string, substrateApi: _SubstrateApi): Promise<NominatorMetadata | undefined> {
  if (isEthereumAddress(address)) {
    return;
  }

  const chain = chainInfo.slug;
  const chainApi = await substrateApi.isReady;

  const nominationList: NominationInfo[] = [];
  const unstakingList: UnstakingInfo[] = [];

  const allDappsReq = new Promise(function (resolve) {
    fetch(`https://api.astar.network/api/v1/${chain}/dapps-staking/dapps`, {
      method: 'GET'
    }).then((resp) => {
      resolve(resp.json());
    }).catch(console.error);
  });

  const [_ledger, _era, _stakerInfo] = await Promise.all([
    chainApi.api.query.dappsStaking.ledger(address),
    chainApi.api.query.dappsStaking.currentEra(),
    chainApi.api.query.dappsStaking.generalStakerInfo.entries(address)
  ]);

  const ledger = _ledger.toPrimitive() as unknown as PalletDappsStakingAccountLedger;
  const currentEra = _era.toString();

  let bnTotalActiveStake = BN_ZERO;

  if (_stakerInfo.length > 0) {
    const dAppInfoMap: Record<string, PalletDappsStakingDappInfo> = {};
    const allDapps = await allDappsReq as PalletDappsStakingDappInfo[];

    allDapps.forEach((dappInfo) => {
      dAppInfoMap[dappInfo.address.toLowerCase()] = dappInfo;
    });

    for (const item of _stakerInfo) {
      const data = item[0].toHuman() as unknown as any[];
      const stakedDapp = data[1] as Record<string, string>;
      const stakeData = item[1].toPrimitive() as Record<string, Record<string, string>[]>;
      const stakeList = stakeData.stakes;

      const dappAddress = stakedDapp.Evm.toLowerCase();
      const currentStake = stakeList.slice(-1)[0].staked.toString() || '0';

      const bnCurrentStake = new BN(currentStake);

      if (bnCurrentStake.gt(BN_ZERO)) {
        bnTotalActiveStake = bnTotalActiveStake.add(bnCurrentStake);
        const dappInfo = dAppInfoMap[dappAddress];

        nominationList.push({
          chain,
          validatorAddress: dappAddress,
          activeStake: currentStake,
          validatorMinStake: '0',
          validatorIdentity: dappInfo?.name,
          hasUnstaking: false // cannot get unstaking info by dapp
        });
      }
    }
  }

  const unlockingChunks = ledger.unbondingInfo.unlockingChunks;

  if (unlockingChunks.length > 0) {
    const nearestUnstaking = unlockingChunks[0]; // only handle 1 unstaking request at a time, might need to change

    const isClaimable = nearestUnstaking.unlockEra - parseInt(currentEra) <= 0;
    const remainingEra = nearestUnstaking.unlockEra - (parseInt(currentEra) + 1);
    const waitingTime = remainingEra * _STAKING_ERA_LENGTH_MAP[chain];

    unstakingList.push({
      chain,
      status: isClaimable ? UnstakingStatus.CLAIMABLE : UnstakingStatus.UNLOCKING,
      claimable: nearestUnstaking.amount.toString(),
      waitingTime: waitingTime > 0 ? waitingTime : 0
    });
  }

  if (nominationList.length === 0 && unstakingList.length === 0) {
    return;
  }

  return {
    chain,
    type: StakingType.NOMINATED,
    address: address,
    activeStake: bnTotalActiveStake.toString(),
    nominations: nominationList,
    unstakings: unstakingList
  } as NominatorMetadata;
}

export async function getAstarDappsInfo (networkKey: string, substrateApi: _SubstrateApi, decimals: number, address: string) {
  const chainApi = await substrateApi.isReady;
  const rawMaxStakerPerContract = (chainApi.api.consts.dappsStaking.maxNumberOfStakersPerContract).toHuman() as string;
  const rawMinStake = (chainApi.api.consts.dappsStaking.minimumStakingAmount).toHuman() as string;

  const allDappsInfo: ValidatorInfo[] = [];
  const minStake = parseRawNumber(rawMinStake);
  const maxStakerPerContract = parseRawNumber(rawMaxStakerPerContract);

  const allDappsReq = new Promise(function (resolve) {
    fetch(`https://api.astar.network/api/v1/${networkKey}/dapps-staking/dapps`, {
      method: 'GET'
    }).then((resp) => {
      resolve(resp.json());
    }).catch(console.error);
  });

  const [_stakedDapps, _era, _allDapps] = await Promise.all([
    chainApi.api.query.dappsStaking.generalStakerInfo.entries(address),
    chainApi.api.query.dappsStaking.currentEra(),
    allDappsReq
  ]);

  const stakedDappsList: string[] = [];

  for (const item of _stakedDapps) {
    const data = item[0].toHuman() as any[];
    const stakedDapp = data[1] as Record<string, string>;
    const _stakes = item[1].toHuman() as Record<string, any>;
    const stakes = _stakes.stakes as Record<string, string>[];
    const latestStakeInfo = stakes[stakes.length - 1];

    if (latestStakeInfo.staked && parseRawNumber(latestStakeInfo.staked) !== 0) {
      stakedDappsList.push((stakedDapp.Evm).toLowerCase());
    }
  }

  const era = parseRawNumber(_era.toHuman() as string);
  const allDapps = _allDapps as Record<string, any>[];

  await Promise.all(allDapps.map(async (dapp) => {
    const dappName = dapp.name as string;
    const dappAddress = dapp.address as string;
    const dappIcon = isUrl(dapp.iconUrl as string) ? dapp.iconUrl as string : undefined;
    const _contractInfo = await chainApi.api.query.dappsStaking.contractEraStake({ Evm: dappAddress }, era);
    const contractInfo = _contractInfo.toHuman() as Record<string, any>;
    let totalStake = 0;
    let stakerCount = 0;

    if (contractInfo !== null) {
      totalStake = parseRawNumber(contractInfo.total as string);
      stakerCount = parseRawNumber(contractInfo.numberOfStakers as string);
    }

    allDappsInfo.push({
      commission: 0,
      expectedReturn: 0,
      address: dappAddress,
      totalStake: (totalStake / 10 ** decimals).toString(),
      ownStake: '0',
      otherStake: (totalStake / 10 ** decimals).toString(),
      nominatorCount: stakerCount,
      blocked: false,
      isVerified: false,
      minBond: (minStake / 10 ** decimals).toString(),
      isNominated: stakedDappsList.includes(dappAddress.toLowerCase()),
      icon: dappIcon,
      identity: dappName,
      chain: networkKey
    });
  }));

  return {
    maxNominatorPerValidator: maxStakerPerContract,
    era: -1,
    validatorsInfo: allDappsInfo,
    isBondedBefore: false, // No need for this on astar
    bondedValidators: stakedDappsList,
    maxNominations: 100
  };
}

export async function getAstarBondingTxInfo (chainInfo: _ChainInfo, substrateApi: _SubstrateApi, stakerAddress: string, amount: number, dappInfo: ValidatorInfo) {
  const apiPromise = await substrateApi.isReady;
  const { decimals } = _getChainNativeTokenBasicInfo(chainInfo);
  const parsedAmount = amount * (10 ** decimals);
  const binaryAmount = new BN(parsedAmount.toString());

  const extrinsic = apiPromise.api.tx.dappsStaking.bondAndStake({ Evm: dappInfo.address }, binaryAmount);

  return extrinsic.paymentInfo(stakerAddress);
}

export async function handleAstarBondingTxInfo (chainInfo: _ChainInfo, amount: number, networkKey: string, stakerAddress: string, dappInfo: ValidatorInfo, substrateApiMap: Record<string, _SubstrateApi>, evmApiMap: Record<string, _EvmApi>) {
  const { decimals, symbol } = _getChainNativeTokenBasicInfo(chainInfo);

  try {
    const [txInfo, balance] = await Promise.all([
      getAstarBondingTxInfo(chainInfo, substrateApiMap[networkKey], stakerAddress, amount, dappInfo),
      getFreeBalance(networkKey, stakerAddress, substrateApiMap, evmApiMap)
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

export async function getAstarBondingExtrinsic (substrateApi: _SubstrateApi, chainInfo: _ChainInfo, amount: number, networkKey: string, stakerAddress: string, dappInfo: ValidatorInfo) {
  const apiPromise = await substrateApi.isReady;
  const { decimals } = _getChainNativeTokenBasicInfo(chainInfo);
  const parsedAmount = amount * (10 ** decimals);
  const binaryAmount = new BN(parsedAmount.toString());

  return apiPromise.api.tx.dappsStaking.bondAndStake({ Evm: dappInfo.address }, binaryAmount);
}

export async function getAstarUnbondingTxInfo (chainInfo: _ChainInfo, substrateApi: _SubstrateApi, stakerAddress: string, amount: number, dappAddress: string) {
  const apiPromise = await substrateApi.isReady;
  const { decimals } = _getChainNativeTokenBasicInfo(chainInfo);
  const parsedAmount = amount * (10 ** decimals);
  const binaryAmount = new BN(parsedAmount.toString());

  const extrinsic = apiPromise.api.tx.dappsStaking.unbondAndUnstake({ Evm: dappAddress }, binaryAmount);

  return extrinsic.paymentInfo(stakerAddress);
}

export async function handleAstarUnbondingTxInfo (chainInfo: _ChainInfo, amount: number, networkKey: string, stakerAddress: string, dappAddress: string, substrateApiMap: Record<string, _SubstrateApi>, evmApiMap: Record<string, _EvmApi>) {
  const { decimals, symbol } = _getChainNativeTokenBasicInfo(chainInfo);

  try {
    const [txInfo, balance] = await Promise.all([
      getAstarUnbondingTxInfo(chainInfo, substrateApiMap[networkKey], stakerAddress, amount, dappAddress),
      getFreeBalance(networkKey, stakerAddress, substrateApiMap, evmApiMap)
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

export async function getAstarUnbondingExtrinsic (substrateApi: _SubstrateApi, chainInfo: _ChainInfo, amount: number, networkKey: string, stakerAddress: string, dappAddress: string) {
  const apiPromise = await substrateApi.isReady;
  const { decimals } = _getChainNativeTokenBasicInfo(chainInfo);
  const parsedAmount = amount * (10 ** decimals);
  const binaryAmount = new BN(parsedAmount.toString());

  return apiPromise.api.tx.dappsStaking.unbondAndUnstake({ Evm: dappAddress }, binaryAmount);
}

async function getAstarUnlockingInfo (substrateApi: _SubstrateApi, address: string, networkKey: string) {
  const chainApi = await substrateApi.isReady;

  const [_stakingInfo, _era] = await Promise.all([
    chainApi.api.query.dappsStaking.ledger(address),
    chainApi.api.query.dappsStaking.currentEra()
  ]);

  const currentEra = parseRawNumber(_era.toHuman() as string);
  const stakingInfo = _stakingInfo.toHuman() as Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const unlockingChunks = stakingInfo.unbondingInfo.unlockingChunks as Record<string, string>[];

  let nextWithdrawalEra = -1;
  let nextWithdrawalAmount = 0;
  let redeemable = 0;

  for (const chunk of unlockingChunks) {
    const unlockEra = parseRawNumber(chunk.unlockEra);
    const amount = parseRawNumber(chunk.amount);

    // Find next withdrawal
    if (nextWithdrawalEra === -1) {
      nextWithdrawalEra = unlockEra;
      nextWithdrawalAmount = amount;
    } else if (unlockEra <= nextWithdrawalEra) {
      nextWithdrawalEra = unlockEra;
      nextWithdrawalAmount += amount;
    }

    // Find redeemable
    if (unlockEra - currentEra <= 0) {
      redeemable += amount;
    }
  }

  const nextWithdrawal = (nextWithdrawalEra - currentEra) * _STAKING_ERA_LENGTH_MAP[networkKey];

  return {
    nextWithdrawal,
    nextWithdrawalAmount,
    redeemable
  };
}

export async function handleAstarUnlockingInfo (substrateApi: _SubstrateApi, chainInfo: _ChainInfo, networkKey: string, address: string, type: StakingType) {
  const { nextWithdrawal, nextWithdrawalAmount, redeemable } = await getAstarUnlockingInfo(substrateApi, address, networkKey);

  const { decimals } = _getChainNativeTokenBasicInfo(chainInfo);

  const parsedRedeemable = redeemable / (10 ** decimals);
  const parsedNextWithdrawalAmount = nextWithdrawalAmount / (10 ** decimals);

  return {
    address,
    type,
    chain: networkKey,
    nextWithdrawal: nextWithdrawal,
    redeemable: parsedRedeemable,
    nextWithdrawalAmount: parsedNextWithdrawalAmount
  } as UnlockingStakeInfo;
}

export async function getAstarWithdrawalTxInfo (substrateApi: _SubstrateApi, address: string) {
  const apiPromise = await substrateApi.isReady;

  const extrinsic = apiPromise.api.tx.dappsStaking.withdrawUnbonded();

  return extrinsic.paymentInfo(address);
}

export async function handleAstarWithdrawalTxInfo (networkKey: string, chainInfo: _ChainInfo, substrateApiMap: Record<string, _SubstrateApi>, evmApiMap: Record<string, _EvmApi>, address: string) {
  const [txInfo, balance] = await Promise.all([
    getAstarWithdrawalTxInfo(substrateApiMap[networkKey], address),
    getFreeBalance(networkKey, address, substrateApiMap, evmApiMap)
  ]);

  const { decimals, symbol } = _getChainNativeTokenBasicInfo(chainInfo);

  const feeString = parseNumberToDisplay(txInfo.partialFee, decimals) + ` ${symbol}`;
  const rawFee = parseRawNumber(txInfo.partialFee.toString());
  const binaryBalance = new BN(balance);
  const balanceError = txInfo.partialFee.gt(binaryBalance);

  return {
    rawFee,
    fee: feeString,
    balanceError
  } as BasicTxInfo;
}

export async function getAstarWithdrawalExtrinsic (substrateApi: _SubstrateApi) {
  const apiPromise = await substrateApi.isReady;

  return apiPromise.api.tx.dappsStaking.withdrawUnbonded();
}

export async function getAstarClaimRewardTxInfo (substrateApi: _SubstrateApi, address: string) {
  const apiPromise = await substrateApi.isReady;

  const [_stakedDapps, _currentEra] = await Promise.all([
    apiPromise.api.query.dappsStaking.generalStakerInfo.entries(address),
    apiPromise.api.query.dappsStaking.currentEra()
  ]);

  const currentEra = parseRawNumber(_currentEra.toHuman() as string);
  const transactions: SubmittableExtrinsic[] = [];

  for (const item of _stakedDapps) {
    const data = item[0].toHuman() as any[];
    const stakedDapp = data[1] as Record<string, string>;
    const stakeData = item[1].toHuman() as Record<string, Record<string, string>[]>;
    const stakes = stakeData.stakes;
    const dappAddress = stakedDapp.Evm.toLowerCase();

    let numberOfUnclaimedEra = 0;

    for (let i = 0; i < stakes.length; i++) {
      const { era, staked } = stakes[i];
      const bnStaked = new BN(staked.replaceAll(',', ''));
      const parsedEra = parseRawNumber(era);

      if (bnStaked.eq(new BN(0))) {
        continue;
      }

      const nextEraData = stakes[i + 1] ?? null;
      const nextEra = nextEraData && parseRawNumber(nextEraData.era);
      const isLastEra = i === stakes.length - 1;
      const eraToClaim = isLastEra ? currentEra - parsedEra : nextEra - parsedEra;

      numberOfUnclaimedEra += eraToClaim;
    }

    for (let i = 0; i < numberOfUnclaimedEra; i++) {
      const tx = apiPromise.api.tx.dappsStaking.claimStaker({ Evm: dappAddress });

      transactions.push(tx);
    }
  }

  console.log('no of tx: ', transactions.length);

  const extrinsic = apiPromise.api.tx.utility.batch(transactions);

  return extrinsic.paymentInfo(address);
}

export async function handleAstarClaimRewardTxInfo (address: string, networkKey: string, chainInfo: _ChainInfo, substrateApiMap: Record<string, _SubstrateApi>, evmApiMap: Record<string, _EvmApi>) {
  const { decimals, symbol } = _getChainNativeTokenBasicInfo(chainInfo);

  try {
    const [txInfo, balance] = await Promise.all([
      getAstarClaimRewardTxInfo(substrateApiMap[networkKey], address),
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

export async function getAstarClaimRewardExtrinsic (substrateApi: _SubstrateApi, dappAddress: string, address: string) {
  const apiPromise = await substrateApi.isReady;

  const [_stakedDapps, _currentEra] = await Promise.all([
    apiPromise.api.query.dappsStaking.generalStakerInfo.entries(address),
    apiPromise.api.query.dappsStaking.currentEra()
  ]);

  const currentEra = parseRawNumber(_currentEra.toHuman() as string);
  const transactions: SubmittableExtrinsic[] = [];

  for (const item of _stakedDapps) {
    const data = item[0].toHuman() as any[];
    const stakedDapp = data[1] as Record<string, string>;
    const stakeData = item[1].toHuman() as Record<string, Record<string, string>[]>;
    const stakes = stakeData.stakes;
    const dappAddress = stakedDapp.Evm.toLowerCase();

    let numberOfUnclaimedEra = 0;

    for (let i = 0; i < stakes.length; i++) {
      const { era, staked } = stakes[i];
      const bnStaked = new BN(staked.replaceAll(',', ''));
      const parsedEra = parseRawNumber(era);

      if (bnStaked.eq(new BN(0))) {
        continue;
      }

      const nextEraData = stakes[i + 1] ?? null;
      const nextEra = nextEraData && parseRawNumber(nextEraData.era);
      const isLastEra = i === stakes.length - 1;
      const eraToClaim = isLastEra ? currentEra - parsedEra : nextEra - parsedEra;

      numberOfUnclaimedEra += eraToClaim;
    }

    for (let i = 0; i < numberOfUnclaimedEra; i++) {
      const tx = apiPromise.api.tx.dappsStaking.claimStaker({ Evm: dappAddress });

      transactions.push(tx);
    }
  }

  console.log('no of tx: ', transactions.length);

  return apiPromise.api.tx.utility.batch(transactions);
}

export async function getAstarDelegationInfo (substrateApi: _SubstrateApi, address: string, networkKey: string) {
  const allDappsReq = new Promise(function (resolve) {
    fetch(`https://api.astar.network/api/v1/${networkKey}/dapps-staking/dapps`, {
      method: 'GET'
    }).then((resp) => {
      resolve(resp.json());
    }).catch(console.error);
  });
  const timeout = new Promise((resolve) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      resolve(null);
    }, 2000);
  });

  const racePromise = Promise.race([
    allDappsReq,
    timeout
  ]);

  const [_stakedDapps, _allDapps] = await Promise.all([
    substrateApi.api.query.dappsStaking.generalStakerInfo.entries(address),
    racePromise
  ]);

  const rawMinStake = (substrateApi.api.consts.dappsStaking.minimumStakingAmount).toHuman() as string;
  const minStake = parseRawNumber(rawMinStake);

  let allDapps: Record<string, any>[] | null = null;

  if (_allDapps !== null) {
    allDapps = _allDapps as Record<string, any>[];
  }

  const dappMap: Record<string, { identity: string; icon?: string; }> = {};
  const delegationsList: DelegationItem[] = [];

  if (allDapps !== null) {
    for (const dappInfo of allDapps) {
      const dappAddress = dappInfo.address as string;
      const dappName = dappInfo.name as string;
      const dappIcon = isUrl(dappInfo.iconUrl as string) ? dappInfo.iconUrl as string : undefined;

      dappMap[dappAddress.toLowerCase()] = { identity: dappName, icon: dappIcon };
    }
  }

  for (const item of _stakedDapps) {
    const data = item[0].toHuman() as any[];
    const stakedDapp = data[1] as Record<string, string>;
    const stakeData = item[1].toHuman() as Record<string, Record<string, string>[]>;
    const stakeList = stakeData.stakes;
    const dappAddress = stakedDapp.Evm.toLowerCase();
    let totalStake = 0;

    if (stakeList.length > 0) {
      const latestStake = stakeList.slice(-1)[0].staked.toString();

      totalStake = parseRawNumber(latestStake);
    }

    delegationsList.push({
      owner: dappAddress,
      amount: totalStake.toString(),
      minBond: minStake.toString(),
      identity: dappMap[dappAddress] ? dappMap[dappAddress].identity : undefined,
      icon: dappMap[dappAddress] ? dappMap[dappAddress].icon : undefined,
      hasScheduledRequest: false
    });
  }

  return delegationsList;
}
