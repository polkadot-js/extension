// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { ChainStakingMetadata, NominationInfo, NominatorMetadata, StakingType, UnstakingInfo, ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import { getEarningStatusByNominations, PalletDappsStakingAccountLedger, PalletDappsStakingDappInfo } from '@subwallet/extension-base/koni/api/staking/bonding/utils';
import { _STAKING_ERA_LENGTH_MAP } from '@subwallet/extension-base/services/chain-service/constants';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { EarningStatus, UnstakingStatus } from '@subwallet/extension-base/types';
import { isUrl, parseRawNumber } from '@subwallet/extension-base/utils';

import { SubmittableExtrinsic } from '@polkadot/api/promise/types';
import { Codec } from '@polkadot/types/types';
import { BN, BN_ZERO } from '@polkadot/util';
import { isEthereumAddress } from '@polkadot/util-crypto';

const convertAddress = (address: string) => {
  return isEthereumAddress(address) ? address.toLowerCase() : address;
};

const fetchDApps = async (network: string) => {
  return new Promise(function (resolve) {
    fetch(`https://api.astar.network/api/v1/${network}/dapps-staking/dappssimple`, {
      method: 'GET'
    }).then((resp) => {
      resolve(resp.json());
    }).catch(console.error);
  });
};

export function subscribeAstarStakingMetadata (chain: string, substrateApi: _SubstrateApi, callback: (chain: string, rs: ChainStakingMetadata) => void) {
  return substrateApi.api.query.dappsStaking.currentEra((_currentEra: Codec) => {
    const era = _currentEra.toString();
    const minDelegatorStake = substrateApi.api.consts.dappsStaking.minimumStakingAmount.toString();
    const unstakingDelay = substrateApi.api.consts.dappsStaking.unbondingPeriod.toString();

    const unstakingPeriod = parseInt(unstakingDelay) * _STAKING_ERA_LENGTH_MAP[chain];

    callback(chain, {
      chain,
      type: StakingType.NOMINATED,
      era: parseInt(era),
      minStake: minDelegatorStake,
      maxValidatorPerNominator: 100, // temporary fix for Astar, there's no limit for now
      maxWithdrawalRequestPerValidator: 1, // by default
      allowCancelUnstaking: false,
      unstakingPeriod
    });
  });
}

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
    allowCancelUnstaking: false,
    unstakingPeriod
  } as ChainStakingMetadata;
}

export async function subscribeAstarNominatorMetadata (chainInfo: _ChainInfo, address: string, substrateApi: _SubstrateApi, ledger: PalletDappsStakingAccountLedger) {
  const nominationList: NominationInfo[] = [];
  const unstakingList: UnstakingInfo[] = [];

  const allDappsReq = fetchDApps(chainInfo.slug);

  const [_allDapps, _era, _stakerInfo] = await Promise.all([
    allDappsReq,
    substrateApi.api.query.dappsStaking.currentEra(),
    substrateApi.api.query.dappsStaking.generalStakerInfo.entries(address)
  ]);

  const currentEra = _era.toString();
  const minDelegatorStake = substrateApi.api.consts.dappsStaking.minimumStakingAmount.toString();
  const allDapps = _allDapps as PalletDappsStakingDappInfo[];

  let bnTotalActiveStake = BN_ZERO;

  if (_stakerInfo.length > 0) {
    const dAppInfoMap: Record<string, PalletDappsStakingDappInfo> = {};

    allDapps.forEach((dappInfo) => {
      dAppInfoMap[convertAddress(dappInfo.address)] = dappInfo;
    });

    for (const item of _stakerInfo) {
      const data = item[0].toHuman() as unknown as any[];
      const stakedDapp = data[1] as Record<string, string>;
      const stakeData = item[1].toPrimitive() as Record<string, Record<string, string>[]>;
      const stakeList = stakeData.stakes;

      const _dappAddress = stakedDapp.Evm ? stakedDapp.Evm.toLowerCase() : stakedDapp.Wasm;
      const dappAddress = convertAddress(_dappAddress);
      const currentStake = stakeList.slice(-1)[0].staked.toString() || '0';

      const bnCurrentStake = new BN(currentStake);

      if (bnCurrentStake.gt(BN_ZERO)) {
        const dappStakingStatus = bnCurrentStake.gt(BN_ZERO) && bnCurrentStake.gte(new BN(minDelegatorStake)) ? EarningStatus.EARNING_REWARD : EarningStatus.NOT_EARNING;

        bnTotalActiveStake = bnTotalActiveStake.add(bnCurrentStake);
        const dappInfo = dAppInfoMap[dappAddress];

        nominationList.push({
          status: dappStakingStatus,
          chain: chainInfo.slug,
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
    for (const unlockingChunk of unlockingChunks) {
      const isClaimable = unlockingChunk.unlockEra - parseInt(currentEra) < 0;
      const remainingEra = unlockingChunk.unlockEra - parseInt(currentEra);
      const waitingTime = remainingEra * _STAKING_ERA_LENGTH_MAP[chainInfo.slug];

      unstakingList.push({
        chain: chainInfo.slug,
        status: isClaimable ? UnstakingStatus.CLAIMABLE : UnstakingStatus.UNLOCKING,
        claimable: unlockingChunk.amount.toString(),
        waitingTime
      });
    }
  }

  if (nominationList.length === 0 && unstakingList.length === 0) {
    return {
      chain: chainInfo.slug,
      type: StakingType.NOMINATED,
      address,
      status: EarningStatus.NOT_STAKING,
      activeStake: '0',
      nominations: [],
      unstakings: []
    } as NominatorMetadata;
  }

  const stakingStatus = getEarningStatusByNominations(bnTotalActiveStake, nominationList);

  return {
    chain: chainInfo.slug,
    type: StakingType.NOMINATED,
    address: address,
    activeStake: bnTotalActiveStake.toString(),
    nominations: nominationList,
    unstakings: unstakingList,
    status: stakingStatus
  } as NominatorMetadata;
}

/**
 * Deprecated
 * */
export async function getAstarNominatorMetadata (chainInfo: _ChainInfo, address: string, substrateApi: _SubstrateApi): Promise<NominatorMetadata | undefined> {
  if (isEthereumAddress(address)) {
    return;
  }

  const chain = chainInfo.slug;
  const chainApi = await substrateApi.isReady;

  const nominationList: NominationInfo[] = [];
  const unstakingList: UnstakingInfo[] = [];

  const allDappsReq = fetchDApps(chain);

  const [_ledger, _era, _stakerInfo] = await Promise.all([
    chainApi.api.query.dappsStaking.ledger(address),
    chainApi.api.query.dappsStaking.currentEra(),
    chainApi.api.query.dappsStaking.generalStakerInfo.entries(address)
  ]);

  const ledger = _ledger.toPrimitive() as unknown as PalletDappsStakingAccountLedger;
  const currentEra = _era.toString();
  const minDelegatorStake = chainApi.api.consts.dappsStaking.minimumStakingAmount.toString();

  let bnTotalActiveStake = BN_ZERO;

  if (_stakerInfo.length > 0) {
    const dAppInfoMap: Record<string, PalletDappsStakingDappInfo> = {};
    const allDapps = await allDappsReq as PalletDappsStakingDappInfo[];

    allDapps.forEach((dappInfo) => {
      const address = isEthereumAddress(dappInfo.address) ? dappInfo.address.toLowerCase() : dappInfo.address;

      dAppInfoMap[address] = dappInfo;
    });

    for (const item of _stakerInfo) {
      const data = item[0].toHuman() as unknown as any[];
      const stakedDapp = data[1] as Record<string, string>;
      const stakeData = item[1].toPrimitive() as Record<string, Record<string, string>[]>;
      const stakeList = stakeData.stakes;

      const dappAddress = convertAddress(stakedDapp.Evm);
      const currentStake = stakeList.slice(-1)[0].staked.toString() || '0';

      const bnCurrentStake = new BN(currentStake);

      if (bnCurrentStake.gt(BN_ZERO)) {
        const dappStakingStatus = bnCurrentStake.gt(BN_ZERO) && bnCurrentStake.gte(new BN(minDelegatorStake)) ? EarningStatus.EARNING_REWARD : EarningStatus.NOT_EARNING;

        bnTotalActiveStake = bnTotalActiveStake.add(bnCurrentStake);
        const dappInfo = dAppInfoMap[dappAddress];

        nominationList.push({
          status: dappStakingStatus,
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
    for (const unlockingChunk of unlockingChunks) {
      const isClaimable = unlockingChunk.unlockEra - parseInt(currentEra) < 0;
      const remainingEra = unlockingChunk.unlockEra - parseInt(currentEra);
      const waitingTime = remainingEra * _STAKING_ERA_LENGTH_MAP[chain];

      unstakingList.push({
        chain,
        status: isClaimable ? UnstakingStatus.CLAIMABLE : UnstakingStatus.UNLOCKING,
        claimable: unlockingChunk.amount.toString(),
        waitingTime
      });
    }
  }

  if (nominationList.length === 0 && unstakingList.length === 0) {
    return {
      chain: chainInfo.slug,
      type: StakingType.NOMINATED,
      address,
      status: EarningStatus.NOT_STAKING,
      activeStake: '0',
      nominations: [],
      unstakings: []
    } as NominatorMetadata;
  }

  const stakingStatus = getEarningStatusByNominations(bnTotalActiveStake, nominationList);

  return {
    chain,
    type: StakingType.NOMINATED,
    address: address,
    activeStake: bnTotalActiveStake.toString(),
    nominations: nominationList,
    unstakings: unstakingList,
    status: stakingStatus
  } as NominatorMetadata;
}

export async function getAstarDappsInfo (networkKey: string, substrateApi: _SubstrateApi) {
  const chainApi = await substrateApi.isReady;
  const rawMaxStakerPerContract = (chainApi.api.consts.dappsStaking.maxNumberOfStakersPerContract).toHuman() as string;

  const allDappsInfo: ValidatorInfo[] = [];
  const maxStakerPerContract = parseRawNumber(rawMaxStakerPerContract);

  const allDappsReq = fetchDApps(networkKey);

  const [_era, _allDapps] = await Promise.all([
    chainApi.api.query.dappsStaking.currentEra(),
    allDappsReq
  ]);

  const era = parseRawNumber(_era.toHuman() as string);
  const allDapps = _allDapps as Record<string, any>[];

  await Promise.all(allDapps.map(async (dapp) => {
    const dappName = dapp.name as string;
    const dappAddress = dapp.address as string;
    const dappIcon = isUrl(dapp.iconUrl as string) ? dapp.iconUrl as string : undefined;
    const contractParam = isEthereumAddress(dappAddress) ? { Evm: dappAddress } : { Wasm: dappAddress };
    const _contractInfo = await chainApi.api.query.dappsStaking.contractEraStake(contractParam, era);
    const contractInfo = _contractInfo.toPrimitive() as Record<string, any>;
    let totalStake = '0';
    let stakerCount = 0;

    if (contractInfo !== null) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
      totalStake = contractInfo?.total?.toString();
      stakerCount = contractInfo.numberOfStakers as number;
    }

    allDappsInfo.push({
      commission: 0,
      expectedReturn: 0,
      address: convertAddress(dappAddress),
      totalStake: totalStake,
      ownStake: '0',
      otherStake: totalStake.toString(),
      nominatorCount: stakerCount,
      blocked: false,
      isVerified: false,
      minBond: '0',
      icon: dappIcon,
      identity: dappName,
      chain: networkKey,
      isCrowded: stakerCount >= maxStakerPerContract
    });
  }));

  return allDappsInfo;
}

export async function getAstarBondingExtrinsic (substrateApi: _SubstrateApi, amount: string, dappInfo: ValidatorInfo) {
  const chainApi = await substrateApi.isReady;
  const binaryAmount = new BN(amount);

  const dappParam = isEthereumAddress(dappInfo.address) ? { Evm: dappInfo.address } : { Wasm: dappInfo.address };

  return chainApi.api.tx.dappsStaking.bondAndStake(dappParam, binaryAmount);
}

export async function getAstarUnbondingExtrinsic (substrateApi: _SubstrateApi, amount: string, dappAddress: string) {
  const apiPromise = await substrateApi.isReady;
  const binaryAmount = new BN(amount);

  const dappParam = isEthereumAddress(dappAddress) ? { Evm: dappAddress } : { Wasm: dappAddress };

  return apiPromise.api.tx.dappsStaking.unbondAndUnstake(dappParam, binaryAmount);
}

export async function getAstarWithdrawalExtrinsic (substrateApi: _SubstrateApi) {
  const chainApi = await substrateApi.isReady;

  return chainApi.api.tx.dappsStaking.withdrawUnbonded();
}

export async function getAstarClaimRewardExtrinsic (substrateApi: _SubstrateApi, address: string) {
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
    const dappAddress = isEthereumAddress(stakedDapp.Evm) ? stakedDapp.Evm.toLowerCase() : stakedDapp.Evm;

    let numberOfUnclaimedEra = 0;
    const maxTx = 50;

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

    const dappParam = isEthereumAddress(dappAddress) ? { Evm: dappAddress } : { Wasm: dappAddress };

    for (let i = 0; i < Math.min(numberOfUnclaimedEra, maxTx); i++) {
      const tx = apiPromise.api.tx.dappsStaking.claimStaker(dappParam);

      transactions.push(tx);
    }
  }

  return apiPromise.api.tx.utility.batch(transactions);
}

export function getAstarWithdrawable (nominatorMetadata: NominatorMetadata): UnstakingInfo {
  const unstakingInfo: UnstakingInfo = {
    chain: nominatorMetadata.chain,
    status: UnstakingStatus.CLAIMABLE,
    claimable: '0',
    waitingTime: 0
  };

  let bnWithdrawable = BN_ZERO;

  for (const unstaking of nominatorMetadata.unstakings) {
    if (unstaking.status === UnstakingStatus.CLAIMABLE) {
      bnWithdrawable = bnWithdrawable.add(new BN(unstaking.claimable));
    }
  }

  unstakingInfo.claimable = bnWithdrawable.toString();

  return unstakingInfo;
}
