// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { BasicTxInfo, ChainStakingMetadata, NominatorMetadata, StakingType, UnlockingStakeInfo, ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import { _STAKING_ERA_LENGTH_MAP } from '@subwallet/extension-base/services/chain-service/constants';
import { _EvmApi, _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getChainNativeTokenBasicInfo } from '@subwallet/extension-base/services/chain-service/utils';
import { parseNumberToDisplay, parseRawNumber } from '@subwallet/extension-base/utils';
import { getFreeBalance } from '@subwallet/extension-koni-base/api/dotsama/balance';
import {
  calculateAlephZeroValidatorReturn,
  calculateChainStakedReturn,
  calculateInflation,
  calculateValidatorStakedReturn,
  getCommission,
  PalletIdentityRegistration, parseIdentity,
  Unlocking,
  ValidatorExtraInfo
} from '@subwallet/extension-koni-base/api/staking/bonding/utils';

import { BN, BN_ONE, BN_ZERO } from '@polkadot/util';

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

  return {
    chain,
    type: StakingType.NOMINATED,
    era: parseInt(currentEra),
    expectedReturn, // in %, annually
    inflation,
    minStake,
    maxValidatorPerNominator: parseInt(maxNominations),
    maxWithdrawalRequestPerValidator: parseInt(maxUnlockingChunks),
    allowCancelUnstaking: true
  } as ChainStakingMetadata;
}

// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {ApiPromise, WsProvider} from "@polkadot/api";
import {BN, BN_ZERO} from "@polkadot/util";
import {parseRawNumber, reformatAddress} from "@subwallet/extension-base/utils";
import {
  BlockHeader,
  calculateChainStakedReturn,
  calculateInflation,
  getParaCurrentInflation,
  InflationConfig, PalletDappsStakingAccountLedger, PalletDappsStakingDappInfo,
  PalletIdentityRegistration,
  PalletParachainStakingDelegationRequestsScheduledRequest,
  PalletParachainStakingDelegator, ParachainStakingCandidateMetadata, ParachainStakingStakeOption,
  parseIdentity
} from "../api/staking/bonding/utils";
import {PalletStakingNominations, PalletStakingStakingLedger} from "../api/staking/bonding/relayChain";
import {NominationInfo, UnstakingInfo, UnstakingStatus} from "@subwallet/extension-base/background/KoniTypes";
import {_STAKING_ERA_LENGTH_MAP} from "@subwallet/extension-base/services/chain-service/constants";
import fetch from 'cross-fetch';

jest.setTimeout(5000000);

// describe('test staking api v2', () => {
//   test('test get chainStakingMetadata for relaychain', async () => {
//     const provider = new WsProvider('wss://polkadot.api.onfinality.io/public-ws');
//     const apiPromise = new ApiPromise({ provider });
//     const api = await apiPromise.isReady;
//     const chain = 'polkadot';
//
//     const _era = await api.query.staking.currentEra();
//     const currentEra = _era.toString();
//     const maxNominations = api.consts.staking.maxNominations.toString();
//     const maxUnlockingChunks = api.consts.staking.maxUnlockingChunks.toString();
//
//     const [_totalEraStake, _totalIssuance, _auctionCounter, _minimumActiveStake] = await Promise.all([
//       api.query.staking.erasTotalStake(parseInt(currentEra)),
//       api.query.balances.totalIssuance(),
//       api.query.auctions?.auctionCounter(),
//       api.query.staking.minimumActiveStake()
//     ]);
//
//     const minStake = _minimumActiveStake.toString();
//
//     const rawTotalEraStake = _totalEraStake.toString();
//     const rawTotalIssuance = _totalIssuance.toString();
//
//     const numAuctions = _auctionCounter ? _auctionCounter.toHuman() as number : 0;
//
//     const bnTotalEraStake = new BN(rawTotalEraStake);
//     const bnTotalIssuance = new BN(rawTotalIssuance);
//
//     const inflation = calculateInflation(bnTotalEraStake, bnTotalIssuance, numAuctions, chain);
//     const expectedReturn = calculateChainStakedReturn(inflation, bnTotalEraStake, bnTotalIssuance, chain);
//
//     console.log('expectedReturn', expectedReturn - inflation);
//     console.log('minStake', minStake);
//     console.log('maxValidatorPerNominator', parseInt(maxNominations));
//     console.log('maxWithdrawalRequestPerValidator', parseInt(maxUnlockingChunks));
//   });
//
//   test('test get chainStakingMetadata for parachain', async () => {
//     const provider = new WsProvider('wss://moonbeam.unitedbloc.com:3001');
//     const apiPromise = new ApiPromise({ provider });
//     const api = await apiPromise.isReady;
//     const networkKey = 'moonbeam';
//
//     const _round = (await api.query.parachainStaking.round()).toHuman() as Record<string, string>;
//     const round = parseRawNumber(_round.current);
//     const maxDelegation = api.consts.parachainStaking.maxDelegationsPerDelegator.toString();
//
//     let _unvestedAllocation;
//
//     if (api.query.vesting && api.query.vesting.totalUnvestedAllocation) {
//       _unvestedAllocation = await api.query.vesting.totalUnvestedAllocation();
//     }
//
//     const [_totalStake, _totalIssuance, _inflation] = await Promise.all([
//       api.query.parachainStaking.staked(round),
//       api.query.balances.totalIssuance(),
//       api.query.parachainStaking.inflationConfig()
//     ]);
//
//     let unvestedAllocation;
//
//     if (_unvestedAllocation) {
//       const rawUnvestedAllocation = _unvestedAllocation.toString();
//
//       unvestedAllocation = new BN(rawUnvestedAllocation);
//     }
//
//     const totalStake = _totalStake ? new BN(_totalStake.toString()) : BN_ZERO;
//     const totalIssuance = new BN(_totalIssuance.toString());
//
//     if (unvestedAllocation) {
//       totalIssuance.add(unvestedAllocation); // for Turing network, read more at https://hackmd.io/@sbAqOuXkRvyiZPOB3Ryn6Q/Sypr3ZJh5
//     }
//
//     const inflationConfig = _inflation.toHuman() as unknown as InflationConfig;
//     const currentInflation = getParaCurrentInflation(parseRawNumber(totalStake.toString()), inflationConfig);
//     const rewardDistribution = 0.5;
//     const rewardPool = currentInflation * rewardDistribution;
//
//     const stakedReturn = calculateChainStakedReturn(rewardPool, totalStake, totalIssuance, networkKey);
//
//     console.log('currentInflation', currentInflation);
//     console.log('expectedReturn', stakedReturn);
//     console.log('minStake', 0); // chain has no requirement for minStake, but collators do
//     console.log('maxValidatorPerNominator', parseInt(maxDelegation));
//     console.log('maxWithdrawalRequestPerValidator', 1); // maximum of 1 withdrawal
//   });
//
//   test('test get chainStakingMetadata for amplitude/kilt/pendulum', async () => {
//     const provider = new WsProvider('wss://rpc-pendulum.prd.pendulumchain.tech');
//     const apiPromise = new ApiPromise({ provider });
//     const api = await apiPromise.isReady;
//
//     const _round = (await api.query.parachainStaking.round()).toHuman() as Record<string, string>;
//     const round = parseRawNumber(_round.current);
//     const maxDelegations = api.consts.parachainStaking.maxDelegationsPerRound.toString();
//     const minDelegatorStake = api.consts.parachainStaking.minDelegatorStake.toString();
//
//     console.log('round', round);
//     console.log('minStake', minDelegatorStake); // chain has no requirement for minStake, but collators do
//     console.log('maxValidatorPerNominator', parseInt(maxDelegations));
//     console.log('maxWithdrawalRequestPerValidator', 1); // maximum of 1 withdrawal
//   });
//
//   test('test get chainStakingMetadata for astar', async () => {
//     const provider = new WsProvider('wss://1rpc.io/astr');
//     const apiPromise = new ApiPromise({ provider });
//     const api = await apiPromise.isReady;
//
//     const era = (await api.query.dappsStaking.currentEra()).toString();
//     const minDelegatorStake = api.consts.dappsStaking.minimumStakingAmount.toString();
//
//     console.log('round', era);
//     console.log('minStake', minDelegatorStake); // chain has no requirement for minStake, but collators do
//     console.log('maxValidatorPerNominator', 100);
//     console.log('maxWithdrawalRequestPerValidator', 1); // maximum of 1 withdrawal
//   });
//
//   test('test get nominatorMetadata for relaychain', async () => {
//     const provider = new WsProvider('wss://rpc.dotters.network/kusama');
//     const apiPromise = new ApiPromise({ provider });
//     const api = await apiPromise.isReady;
//     const address = 'Cr4WJJmiyg6V61MBp55kpinQLYeDtpbV6Pw5etKgcHCN9eB';
//     // kusama Cr4WJJmiyg6V61MBp55kpinQLYeDtpbV6Pw5etKgcHCN9eB
//     // westend 5FLkwNNyZAuyzCAKMc7cjDa5i8AxEDEeL4kGoYzaWHtvfKeS
//     // westend
//     const chain = 'kusama';
//
//     const [_ledger, _nominations, _currentEra] = await Promise.all([
//       api.query.staking.ledger(address),
//       api.query.staking.nominators(address),
//       api.query.staking.currentEra()
//     ]);
//
//     const ledger = _ledger.toJSON() as unknown as PalletStakingStakingLedger;
//     const nominations = _nominations.toJSON() as unknown as PalletStakingNominations;
//     const currentEra = _currentEra.toString();
//
//     if (ledger) {
//       const activeStake = ledger.active.toString();
//       const nominationList: NominationInfo[] = [];
//       const unstakingList: UnstakingInfo[] = [];
//
//       if (nominations) {
//         const validatorList = nominations.targets;
//
//         await Promise.all(validatorList.map(async (validatorAddress) => {
//           const identityInfo = (await api.query.identity.identityOf(validatorAddress)).toHuman() as unknown as PalletIdentityRegistration;
//           const identity = parseIdentity(identityInfo);
//
//           nominationList.push({
//             chain,
//             validatorAddress,
//             validatorIdentity: identity,
//             activeStake: '0' // relaychain allocates stake accordingly
//           } as NominationInfo)
//         }));
//       }
//
//       ledger.unlocking.forEach((unlockingChunk) => {
//         const isClaimable = unlockingChunk.era - parseInt(currentEra) <= 0;
//         const remainingEra = unlockingChunk.era - (parseInt(currentEra) + 1);
//         const waitingTime = remainingEra * _STAKING_ERA_LENGTH_MAP[chain];
//
//         unstakingList.push({
//           chain,
//           status: isClaimable ? UnstakingStatus.CLAIMABLE : UnstakingStatus.UNLOCKING,
//           claimable: unlockingChunk.value.toString(),
//           waitingTime: waitingTime > 0 ? waitingTime : 0
//         } as UnstakingInfo);
//       });
//
//       console.log('nominations', nominationList);
//       console.log('activeStake', activeStake);
//       console.log('unstakingList', unstakingList);
//     }
//   });
//
//   test('test get nominatorMetadata for parachain', async () => {
//     const provider = new WsProvider('wss://bifrost-parachain.api.onfinality.io/public-ws');
//     const apiPromise = new ApiPromise({ provider });
//     const api = await apiPromise.isReady;
//     const address = 'fMTxDorgQeKopohrjxcrruWeRRvnrKyeaNGF2Zzv37qFsTu';
//     const chain = 'moonbeam';
//
//     const nominationList: NominationInfo[] = [];
//     const unstakingMap: Record<string, UnstakingInfo> = {};
//
//     const _delegatorState = await api.query.parachainStaking.delegatorState(address);
//
//     const delegatorState = _delegatorState.toPrimitive() as unknown as PalletParachainStakingDelegator;
//
//     if (delegatorState) {
//       await Promise.all(delegatorState.delegations.map(async (delegation) => {
//         const [_delegationScheduledRequests, _identity, _roundInfo] = await Promise.all([
//           api.query.parachainStaking.delegationScheduledRequests(delegation.owner),
//           api.query.identity.identityOf(delegation.owner),
//           api.query.parachainStaking.round()
//         ]);
//
//         const identityInfo = _identity.toHuman() as unknown as PalletIdentityRegistration;
//         const roundInfo = _roundInfo.toPrimitive() as Record<string, number>;
//         const delegationScheduledRequests =  _delegationScheduledRequests.toPrimitive() as unknown as PalletParachainStakingDelegationRequestsScheduledRequest[];
//
//         const currentRound = roundInfo.current;
//         const identity = parseIdentity(identityInfo);
//         let hasUnstaking = false;
//
//         // parse unstaking info
//         if (delegationScheduledRequests) {
//           for (const scheduledRequest of delegationScheduledRequests) {
//             if (reformatAddress(scheduledRequest.delegator, 0) === reformatAddress(address, 0)) { // add network prefix
//               const isClaimable = scheduledRequest.whenExecutable - currentRound <= 0;
//               const remainingEra = scheduledRequest.whenExecutable - (currentRound + 1);
//               const waitingTime = remainingEra * _STAKING_ERA_LENGTH_MAP[chain];
//               const claimable = Object.values(scheduledRequest.action)[0];
//
//               unstakingMap[delegation.owner] = {
//                 chain,
//                 status: isClaimable ? UnstakingStatus.CLAIMABLE : UnstakingStatus.UNLOCKING,
//                 validatorAddress: delegation.owner,
//                 claimable: claimable.toString(),
//                 waitingTime: waitingTime > 0 ? waitingTime : 0
//               } as UnstakingInfo;
//
//               hasUnstaking = true;
//               break; // only handle 1 scheduledRequest per collator
//             }
//           }
//         }
//
//         const bnTotalStake = new BN(delegation.amount);
//         const bnUnstakeBalance = unstakingMap[delegation.owner] ? new BN(unstakingMap[delegation.owner].claimable) : BN_ZERO;
//
//         const bnActiveStake = bnTotalStake.sub(bnUnstakeBalance);
//
//         nominationList.push({
//           chain,
//           validatorAddress: delegation.owner,
//           validatorIdentity: identity,
//           activeStake: bnActiveStake.toString(),
//           hasUnstaking
//         });
//       }));
//
//       await Promise.all(nominationList.map(async (nomination) => {
//         const _collatorInfo = await api.query.parachainStaking.candidateInfo(nomination.validatorAddress);
//         const collatorInfo = _collatorInfo.toPrimitive() as unknown as ParachainStakingCandidateMetadata;
//
//         nomination.validatorMinStake = collatorInfo.lowestTopDelegationAmount.toString();
//       }));
//     }
//
//     console.log('nominations', nominationList);
//     console.log('unstakingList', unstakingMap);
//   });
//
//   test('test get nominatorMetadata for amplitude', async () => {
//     const provider = new WsProvider('wss://amplitude-rpc.dwellir.com');
//     const apiPromise = new ApiPromise({ provider });
//     const api = await apiPromise.isReady;
//     const address = '6jTLqUgENXNH2vbBoKveevApACnHCpVNEkYj7BkBnwXACjna';
//     const chain = 'amplitude';
//
//     const nominationList: NominationInfo[] = [];
//     const unstakingList: UnstakingInfo[] = [];
//
//     const [_delegatorState, _unstakingInfo] = await Promise.all([
//       api.query.parachainStaking.delegatorState(address),
//       api.query.parachainStaking.unstaking(address)
//     ]);
//
//     const delegatorState = _delegatorState.toPrimitive() as unknown as ParachainStakingStakeOption;
//     const unstakingInfo = _unstakingInfo.toPrimitive() as unknown as Record<string, number>;
//
//     if (delegatorState) {
//       const identityInfo = (await api.query.identity.identityOf(delegatorState.owner)).toPrimitive() as unknown as PalletIdentityRegistration;
//       const identity = parseIdentity(identityInfo);
//
//       nominationList.push({
//         chain,
//         validatorAddress: delegatorState.owner,
//         activeStake: delegatorState.amount.toString(),
//         validatorMinStake: '0',
//         hasUnstaking: !!unstakingInfo,
//         validatorIdentity: identity,
//       });
//     }
//
//
//     if (unstakingInfo && Object.values(unstakingInfo).length > 0) {
//       const _currentBlockInfo = await api.rpc.chain.getHeader();
//
//       const currentBlockInfo = _currentBlockInfo.toPrimitive() as unknown as BlockHeader;
//       const currentBlockNumber = currentBlockInfo.number;
//
//       const _blockPerRound = api.consts.parachainStaking.defaultBlocksPerRound.toString();
//       const blockPerRound = parseFloat(_blockPerRound);
//
//       const nearestUnstakingBlock = Object.keys(unstakingInfo)[0];
//       const nearestUnstakingAmount = Object.values(unstakingInfo)[0];
//
//       const blockDuration = (_STAKING_ERA_LENGTH_MAP[chain] || _STAKING_ERA_LENGTH_MAP.default) / blockPerRound; // in hours
//
//       const isClaimable = parseInt(nearestUnstakingBlock) - currentBlockNumber <= 0;
//       const remainingBlock = parseInt(nearestUnstakingBlock) - (currentBlockNumber + 1);
//       const waitingTime = remainingBlock * blockDuration;
//
//       unstakingList.push({
//         chain,
//         status: isClaimable ? UnstakingStatus.CLAIMABLE : UnstakingStatus.UNLOCKING,
//         claimable: nearestUnstakingAmount.toString(),
//         waitingTime: waitingTime > 0 ? waitingTime : 0,
//         validatorAddress: delegatorState.owner
//       });
//     }
//
//     console.log('nominations', nominationList);
//     console.log('unstakingList', unstakingList);
//   });
//
//   test('test get nominatorMetadata for astar', async () => {
//     const provider = new WsProvider('wss://shibuya-rpc.dwellir.com');
//     const apiPromise = new ApiPromise({ provider });
//     const api = await apiPromise.isReady;
//     const address = 'bUCi9zVJioiKE8VHmSTa2Kabs585PSwGcqvjvn955GW7w6t';
//     const chain = 'shibuya';
//
//     const nominationList: NominationInfo[] = [];
//     const unstakingList: UnstakingInfo[] = [];
//
//     const allDappsReq = new Promise(function (resolve) {
//       fetch(`https://api.astar.network/api/v1/${chain}/dapps-staking/dapps`, {
//         method: 'GET'
//       }).then((resp) => {
//         resolve(resp.json());
//       }).catch(console.error);
//     });
//
//     const [_ledger, _era, _stakerInfo] = await Promise.all([
//       api.query.dappsStaking.ledger(address),
//       api.query.dappsStaking.currentEra(),
//       api.query.dappsStaking.generalStakerInfo.entries(address)
//     ]);
//
//     const ledger = _ledger.toPrimitive() as unknown as PalletDappsStakingAccountLedger;
//     const currentEra = _era.toString();
//
//     if (_stakerInfo.length > 0) {
//       let dAppInfoMap: Record<string, PalletDappsStakingDappInfo> = {};
//       const allDapps = await allDappsReq as PalletDappsStakingDappInfo[];
//
//       allDapps.forEach((dappInfo) => {
//         dAppInfoMap[dappInfo.address.toLowerCase()] = dappInfo;
//       })
//
//       for (const item of _stakerInfo) {
//         const data = item[0].toHuman() as unknown as any[];
//         const stakedDapp = data[1] as Record<string, string>;
//         const stakeData = item[1].toPrimitive() as Record<string, Record<string, string>[]>;
//         const stakeList = stakeData.stakes;
//
//         const dappAddress = stakedDapp.Evm.toLowerCase();
//         let totalStake = stakeList.slice(-1)[0].staked.toString() || '0';
//
//         if (parseFloat(totalStake) > 0) {
//           const dappInfo = dAppInfoMap[dappAddress];
//
//           nominationList.push({
//             chain,
//             validatorAddress: dappAddress,
//             activeStake: totalStake,
//             validatorMinStake: '0',
//             validatorIdentity: dappInfo?.name,
//             hasUnstaking: false // cannot get unstaking info by dapp
//           });
//         }
//       }
//     }
//
//     const unlockingChunks = ledger.unbondingInfo.unlockingChunks;
//
//     if (unlockingChunks.length > 0) {
//       const nearestUnstaking = unlockingChunks[0]; // only handle 1 unstaking request at a time, might need to change
//
//       const isClaimable = nearestUnstaking.unlockEra - parseInt(currentEra) <= 0;
//       const remainingEra = nearestUnstaking.unlockEra - (parseInt(currentEra) + 1);
//       const waitingTime = remainingEra * _STAKING_ERA_LENGTH_MAP[chain];
//
//       unstakingList.push({
//         chain,
//         status: isClaimable ? UnstakingStatus.CLAIMABLE : UnstakingStatus.UNLOCKING,
//         claimable: nearestUnstaking.amount.toString(),
//         waitingTime: waitingTime > 0 ? waitingTime : 0
//       });
//     }
//
//     console.log('nominations', nominationList);
//     console.log('unstakingList', unstakingList);
//   });
// });

// export async function getRelayChainNominatorMetadata (chain: string, address: string, substrateApi: _SubstrateApi): Promise<NominatorMetadata> {
//   const chainApi = await substrateApi.isReady;
//
//   const [_ledger, _nominations, _currentEra] = await Promise.all([
//     api.query.staking.ledger(address),
//     api.query.staking.nominators(address),
//     api.query.staking.currentEra()
//   ]);
//
//   const ledger = _ledger.toJSON() as unknown as PalletStakingStakingLedger;
//   const nominations = _nominations.toJSON() as unknown as PalletStakingNominations;
//   const currentEra = _currentEra.toString();
//
//   if (ledger) {
//     const activeStake = ledger.active.toString();
//     const nominationList: NominationInfo[] = [];
//     const unstakingList: UnstakingInfo[] = [];
//
//     if (nominations) {
//       const validatorList = nominations.targets;
//
//       await Promise.all(validatorList.map(async (validatorAddress) => {
//         const identityInfo = (await api.query.identity.identityOf(validatorAddress)).toHuman() as unknown as PalletIdentityRegistration;
//         const identity = parseIdentity(identityInfo);
//
//         nominationList.push({
//           chain,
//           validatorAddress,
//           validatorIdentity: identity,
//           activeStake: '0' // relaychain allocates stake accordingly
//         } as NominationInfo)
//       }));
//     }
//
//     ledger.unlocking.forEach((unlockingChunk) => {
//       const isClaimable = unlockingChunk.era - parseInt(currentEra) <= 0;
//       const remainingEra = unlockingChunk.era - (parseInt(currentEra) + 1);
//       const waitingTime = remainingEra * _STAKING_ERA_LENGTH_MAP[chain];
//
//       unstakingList.push({
//         chain,
//         status: isClaimable ? UnstakingStatus.CLAIMABLE : UnstakingStatus.UNLOCKING,
//         claimable: unlockingChunk.value.toString(),
//         waitingTime: waitingTime > 0 ? waitingTime : 0
//       } as UnstakingInfo);
//     });
// }

export async function getRelayValidatorsInfo (networkKey: string, substrateApi: _SubstrateApi, decimals: number, address: string) {
  const chainApi = await substrateApi.isReady;

  const _era = await chainApi.api.query.staking.currentEra();
  const currentEra = _era.toString();

  const allValidators: string[] = [];
  const result: ValidatorInfo[] = [];

  const [_totalEraStake, _eraStakers, _totalIssuance, _auctionCounter, _minBond, _existedValidators, _bondedInfo] = await Promise.all([
    chainApi.api.query.staking.erasTotalStake(parseInt(currentEra)),
    chainApi.api.query.staking.erasStakers.entries(parseInt(currentEra)),
    chainApi.api.query.balances.totalIssuance(),
    chainApi.api.query.auctions?.auctionCounter(),
    chainApi.api.query.staking.minNominatorBond(),
    chainApi.api.query.staking.nominators(address),
    chainApi.api.query.staking.bonded(address)
  ]);

  const bnTotalEraStake = new BN(_totalEraStake.toString());
  const bnTotalIssuance = new BN(_totalIssuance.toString());

  const rawMaxNominations = (chainApi.api.consts.staking.maxNominations).toHuman() as string;
  const maxNominations = parseFloat(rawMaxNominations.replaceAll(',', ''));
  const rawMaxNominatorPerValidator = (chainApi.api.consts.staking.maxNominatorRewardedPerValidator).toHuman() as string;
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

    // Todo: Update this part later
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
    } as unknown as ValidatorInfo);
  }

  const extraInfoMap: Record<string, ValidatorExtraInfo> = {};

  await Promise.all(allValidators.map(async (address) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const [_commissionInfo, _identityInfo] = await Promise.all([
      chainApi.api.query.staking.validators(address),
      chainApi.api.query?.identity?.identityOf(address)
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

    const bnValidatorStake = totalStakeMap[validator.address].div(bnDecimals);

    validator.expectedReturn = ['aleph', 'alephTest'].includes(networkKey)
      ? calculateAlephZeroValidatorReturn(stakedReturn, getCommission(commission))
      : calculateValidatorStakedReturn(stakedReturn, bnValidatorStake, bnAvgStake, getCommission(commission));
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
