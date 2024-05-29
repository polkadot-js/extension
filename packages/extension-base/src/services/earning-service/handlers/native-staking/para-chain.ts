// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { BasicTxErrorType, ExtrinsicType, NominationInfo, UnstakingInfo } from '@subwallet/extension-base/background/KoniTypes';
import { getBondedValidators, getEarningStatusByNominations, getParaCurrentInflation, InflationConfig, isUnstakeAll } from '@subwallet/extension-base/koni/api/staking/bonding/utils';
import { _EXPECTED_BLOCK_TIME, _STAKING_ERA_LENGTH_MAP } from '@subwallet/extension-base/services/chain-service/constants';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _STAKING_CHAIN_GROUP, MANTA_MIN_DELEGATION, MANTA_VALIDATOR_POINTS_PER_BLOCK } from '@subwallet/extension-base/services/earning-service/constants';
import { parseIdentity } from '@subwallet/extension-base/services/earning-service/utils';
import { BaseYieldPositionInfo, CollatorExtraInfo, EarningStatus, NativeYieldPoolInfo, PalletParachainStakingDelegationRequestsScheduledRequest, PalletParachainStakingDelegator, ParachainStakingCandidateMetadata, StakeCancelWithdrawalParams, SubmitJoinNativeStaking, TransactionData, UnstakingStatus, ValidatorInfo, YieldPoolInfo, YieldPositionInfo, YieldTokenBaseInfo } from '@subwallet/extension-base/types';
import { balanceFormatter, formatNumber, parseRawNumber, reformatAddress } from '@subwallet/extension-base/utils';
import BigN from 'bignumber.js';

import { SubmittableExtrinsic } from '@polkadot/api/types';
import { UnsubscribePromise } from '@polkadot/api-base/types/base';
import { Codec } from '@polkadot/types/types';
import { BN, BN_ZERO } from '@polkadot/util';

import BaseParaNativeStakingPoolHandler from './base-para';

interface PalletParachainStakingRoundInfo {
  current: string,
  first: string,
  length: string
}

interface PalletParachainStakingSetOrderedSet {
  owner: string,
  amount: string
}

interface PalletParachainStakingInflationInflationInfo {
  expect: InflationInfo,
  annual: InflationInfo,
  round: InflationInfo
}

interface InflationInfo {
  min: string,
  ideal: string,
  max: string
}

function calculateMantaNominatorReturn (decimal: number, commission: number, totalActiveCollators: number, bnAnnualInflation: BigN, blocksPreviousRound: number, bnCollatorExpectedBlocksPerRound: BigN, bnCollatorTotalStaked: BigN, isCountCommission: boolean) {
  const MIN_DELEGATION = new BigN(MANTA_MIN_DELEGATION as number);

  const factor = new BigN(10).pow(decimal);
  const annualInflation = bnAnnualInflation.dividedBy(factor);
  const collatorTotalStaked = bnCollatorTotalStaked.dividedBy(factor);

  const annualRewardsPerCollator = annualInflation.dividedBy(totalActiveCollators);

  const adjustmentFactor = new BigN(blocksPreviousRound).dividedBy(bnCollatorExpectedBlocksPerRound);

  const marginalReward = annualRewardsPerCollator.multipliedBy(MIN_DELEGATION).dividedBy((collatorTotalStaked.plus(MIN_DELEGATION)));

  let bnApy = new BigN(100).multipliedBy(adjustmentFactor).multipliedBy(marginalReward).dividedBy(MIN_DELEGATION);

  if (isCountCommission) {
    bnApy = new BigN((1 - commission) * 100).multipliedBy(adjustmentFactor).multipliedBy(marginalReward).dividedBy(MIN_DELEGATION);
  }

  return bnApy.toNumber();
}

export default class ParaNativeStakingPoolHandler extends BaseParaNativeStakingPoolHandler {
  /* Subscribe pool info */

  async subscribePoolInfo (callback: (data: YieldPoolInfo) => void): Promise<VoidFunction> {
    let cancel = false;
    const chainApi = this.substrateApi;
    const nativeToken = this.nativeToken;

    const defaultCallback = async () => {
      const data: NativeYieldPoolInfo = {
        ...this.baseInfo,
        type: this.type,
        metadata: {
          ...this.metadataInfo,
          description: this.getDescription()
        }
      };

      const poolInfo = await this.getPoolInfo();

      !poolInfo && callback(data);
    };

    if (!this.isActive) {
      await defaultCallback();

      return () => {
        cancel = true;
      };
    }

    await defaultCallback();

    await chainApi.isReady;

    const unsub = await (chainApi.api.query.parachainStaking.round(async (_round: Codec) => {
      if (cancel) {
        unsub();

        return;
      }

      const roundObj = _round.toHuman() as Record<string, string>;
      const round = parseRawNumber(roundObj.current);
      const maxDelegations = chainApi.api.consts?.parachainStaking?.maxDelegationsPerDelegator?.toString();
      const unstakingDelay = chainApi.api.consts.parachainStaking.delegationBondLessDelay.toString();
      const maxTopDelegatorsPerCollator = chainApi.api.consts.parachainStaking.maxTopDelegationsPerCandidate?.toPrimitive() as number;
      const maxDelegatorsPerCollator = chainApi.api.consts.parachainStaking.maxDelegatorsPerCollator?.toPrimitive() as number;

      const maxPoolMembers = maxTopDelegatorsPerCollator || maxDelegatorsPerCollator || undefined;

      let _unvestedAllocation;

      if (chainApi.api.query.vesting && chainApi.api.query.vesting.totalUnvestedAllocation) {
        _unvestedAllocation = await chainApi.api.query.vesting.totalUnvestedAllocation();
      }

      const [_totalStake, _totalIssuance, _inflation] = await Promise.all([
        chainApi.api.query.parachainStaking?.staked ? chainApi.api.query.parachainStaking?.staked(round) : chainApi.api.query.parachainStaking.total(),
        chainApi.api.query.balances.totalIssuance(),
        chainApi.api.query.parachainStaking.inflationConfig()
      ]);

      let unvestedAllocation;

      if (_unvestedAllocation) {
        const rawUnvestedAllocation = _unvestedAllocation.toString();

        unvestedAllocation = new BN(rawUnvestedAllocation);
      }

      const totalStake = _totalStake ? new BN(_totalStake.toString()) : BN_ZERO;
      const totalIssuance = new BN(_totalIssuance.toString());

      if (unvestedAllocation) {
        totalIssuance.add(unvestedAllocation); // for Turing network, read more at https://hackmd.io/@sbAqOuXkRvyiZPOB3Ryn6Q/Sypr3ZJh5
      }

      const inflationConfig = _inflation.toHuman() as unknown as InflationConfig;
      const inflation = getParaCurrentInflation(parseRawNumber(totalStake.toString()), inflationConfig);
      const eraTime = _STAKING_ERA_LENGTH_MAP[this.chain] || _STAKING_ERA_LENGTH_MAP.default; // in hours
      const unstakingPeriod = parseInt(unstakingDelay) * eraTime;
      const minStake = '0';
      const minToHuman = formatNumber(minStake.toString(), nativeToken.decimals || 0, balanceFormatter);

      const data: NativeYieldPoolInfo = {
        ...this.baseInfo,
        type: this.type,
        metadata: {
          ...this.metadataInfo,
          description: this.getDescription(minToHuman)
        },
        statistic: {
          assetEarning: [
            {
              slug: this.nativeToken.slug
            }
          ],
          maxCandidatePerFarmer: parseInt(maxDelegations),
          maxWithdrawalRequestPerFarmer: 1, // by default
          earningThreshold: {
            join: minStake.toString(),
            defaultUnstake: '0',
            fastUnstake: '0'
          },
          farmerCount: 0, // TODO recheck
          era: round,
          eraTime,
          totalApy: undefined, // not have
          tvl: totalStake.toString(),
          unstakingPeriod: unstakingPeriod,
          inflation
        },
        maxPoolMembers
      };

      callback(data);
    }) as unknown as UnsubscribePromise);

    return () => {
      cancel = true;
      unsub();
    };
  }

  /* Subscribe pool info */

  /* Subscribe pool position */

  async parseNominatorMetadata (chainInfo: _ChainInfo, address: string, substrateApi: _SubstrateApi, delegatorState: PalletParachainStakingDelegator): Promise<Omit<YieldPositionInfo, keyof BaseYieldPositionInfo>> {
    const nominationList: NominationInfo[] = [];
    const unstakingMap: Record<string, UnstakingInfo> = {};

    let bnTotalActiveStake = BN_ZERO;
    let bnTotalStake = BN_ZERO;
    let bnTotalUnstaking = BN_ZERO;

    const _roundInfo = await substrateApi.api.query.parachainStaking.round();
    const roundInfo = _roundInfo.toPrimitive() as unknown as PalletParachainStakingRoundInfo;
    const currentRound = roundInfo.current;

    await Promise.all(delegatorState.delegations.map(async (delegation) => {
      const [_delegationScheduledRequests, [identity], _collatorInfo, _currentBlock, _currentTimestamp] = await Promise.all([
        substrateApi.api.query.parachainStaking.delegationScheduledRequests(delegation.owner),
        parseIdentity(substrateApi, delegation.owner),
        substrateApi.api.query.parachainStaking.candidateInfo(delegation.owner),
        substrateApi.api.query.system.number(),
        substrateApi.api.query.timestamp.now()
      ]);

      const currentBlock = _currentBlock.toPrimitive() as number;
      const currentTimestamp = _currentTimestamp.toPrimitive() as number;
      const collatorInfo = _collatorInfo.toPrimitive() as unknown as ParachainStakingCandidateMetadata;
      const minDelegation = collatorInfo?.lowestTopDelegationAmount.toString();
      const delegationScheduledRequests = _delegationScheduledRequests.toPrimitive() as unknown as PalletParachainStakingDelegationRequestsScheduledRequest[];

      let hasUnstaking = false;
      let delegationStatus: EarningStatus = EarningStatus.NOT_EARNING;

      // parse unstaking info
      if (delegationScheduledRequests) {
        for (const scheduledRequest of delegationScheduledRequests) {
          if (reformatAddress(scheduledRequest.delegator, 0) === reformatAddress(address, 0)) { // add network prefix
            const isClaimable = scheduledRequest.whenExecutable - parseInt(currentRound) <= 0;
            const remainingEra = scheduledRequest.whenExecutable - parseInt(currentRound);
            const waitingTime = remainingEra * _STAKING_ERA_LENGTH_MAP[chainInfo.slug];
            const claimable = Object.values(scheduledRequest.action)[0];

            // noted: target timestamp in parachainStaking easily volatile if block time volatile
            const targetBlock = remainingEra * parseInt(roundInfo.length) + parseInt(roundInfo.first);
            const remainingBlock = targetBlock - currentBlock;
            const targetTimestampMs = remainingBlock * _EXPECTED_BLOCK_TIME[chainInfo.slug] * 1000 + currentTimestamp;

            unstakingMap[delegation.owner] = {
              chain: chainInfo.slug,
              status: isClaimable ? UnstakingStatus.CLAIMABLE : UnstakingStatus.UNLOCKING,
              validatorAddress: delegation.owner,
              claimable: claimable.toString(),
              waitingTime,
              targetTimestampMs: targetTimestampMs
            } as UnstakingInfo;

            hasUnstaking = true;
            break; // only handle 1 scheduledRequest per collator
          }
        }
      }

      const bnStake = new BN(delegation.amount);
      const bnUnstakeBalance = unstakingMap[delegation.owner] ? new BN(unstakingMap[delegation.owner].claimable) : BN_ZERO;
      const bnActiveStake = bnStake.sub(bnUnstakeBalance);

      if (bnActiveStake.gt(BN_ZERO) && bnActiveStake.gte(new BN(minDelegation))) {
        delegationStatus = EarningStatus.EARNING_REWARD;
      }

      bnTotalActiveStake = bnTotalActiveStake.add(bnActiveStake);
      bnTotalStake = bnTotalStake.add(bnStake);
      bnTotalUnstaking = bnTotalUnstaking.add(bnUnstakeBalance);

      nominationList.push({
        chain: chainInfo.slug,
        status: delegationStatus,
        validatorAddress: delegation.owner,
        validatorIdentity: identity,
        activeStake: bnActiveStake.toString(),
        hasUnstaking,
        validatorMinStake: collatorInfo.lowestTopDelegationAmount.toString()
      });
    }));

    // await Promise.all(nominationList.map(async (nomination) => {
    //   const _collatorInfo = await substrateApi.api.query.parachainStaking.candidateInfo(nomination.validatorAddress);
    //   const collatorInfo = _collatorInfo.toPrimitive() as unknown as ParachainStakingCandidateMetadata;
    //
    //   nomination.validatorMinStake = collatorInfo.lowestTopDelegationAmount.toString();
    // }));

    const stakingStatus = getEarningStatusByNominations(bnTotalActiveStake, nominationList);

    const totalStake = bnTotalStake.toString();
    const activeStake = bnTotalActiveStake.toString();
    const unstakingBalance = bnTotalUnstaking.toString();

    return {
      status: stakingStatus,
      totalStake,
      balanceToken: this.nativeToken.slug,
      activeStake: activeStake,
      unstakeBalance: unstakingBalance,
      isBondedBefore: !!nominationList.length,
      nominations: nominationList,
      unstakings: Object.values(unstakingMap)
    };
  }

  async subscribePoolPosition (useAddresses: string[], resultCallback: (rs: YieldPositionInfo) => void): Promise<VoidFunction> {
    let cancel = false;
    const substrateApi = this.substrateApi;
    const defaultInfo = this.baseInfo;
    const chainInfo = this.chainInfo;

    await substrateApi.isReady;

    const unsub = await substrateApi.api.query.parachainStaking.delegatorState.multi(useAddresses, async (ledgers: Codec[]) => {
      if (cancel) {
        unsub();

        return;
      }

      if (ledgers) {
        await Promise.all(ledgers.map(async (_delegatorState, i) => {
          const delegatorState = _delegatorState.toPrimitive() as unknown as PalletParachainStakingDelegator;
          const owner = reformatAddress(useAddresses[i], 42);

          if (delegatorState) {
            const nominatorMetadata = await this.parseNominatorMetadata(chainInfo, owner, substrateApi, delegatorState);

            resultCallback({
              ...defaultInfo,
              ...nominatorMetadata,
              address: owner,
              type: this.type
            });
          } else {
            resultCallback({
              ...defaultInfo,
              type: this.type,
              address: owner,
              balanceToken: this.nativeToken.slug,
              totalStake: '0',
              activeStake: '0',
              unstakeBalance: '0',
              status: EarningStatus.NOT_STAKING,
              isBondedBefore: false,
              nominations: [],
              unstakings: []
            });
          }
        }));
      }
    });

    return () => {
      cancel = true;
      unsub();
    };
  }

  /* Subscribe pool position */

  /* Get pool targets */
  async getMantaPoolTargets (): Promise<ValidatorInfo[]> {
    const apiProps = await this.substrateApi.isReady;
    const allCollators: ValidatorInfo[] = [];

    const DECIMAL = this.chainInfo.substrateInfo?.decimals as number;
    const POINTS_PER_BLOCK = MANTA_VALIDATOR_POINTS_PER_BLOCK as number; // producing 1 block will get 20 points for validator

    const [_allCollators, _collatorCommission, _allCollatorsPool, _selectedCollators, _round, _totalIssuance, _inflationConfig] = await Promise.all([
      apiProps.api.query.parachainStaking.candidateInfo.entries(),
      apiProps.api.query.parachainStaking.collatorCommission(),
      apiProps.api.query.parachainStaking.candidatePool(),
      apiProps.api.query.parachainStaking.selectedCandidates(),
      apiProps.api.query.parachainStaking.round(),
      apiProps.api.query.balances.totalIssuance(),
      apiProps.api.query.parachainStaking.inflationConfig()
    ]);

    // noted: Annual Inflation = Total Issuance * Annual Inflation Percent
    const round = _round.toPrimitive() as unknown as PalletParachainStakingRoundInfo;
    const totalIssuance = _totalIssuance.toString();
    const inflationConfig = _inflationConfig.toHuman() as unknown as PalletParachainStakingInflationInflationInfo;
    const annualInflationPercent = parseFloat(inflationConfig.annual.ideal.slice(0, -1)) / 100;
    const bnAnnualInflation = new BigN(totalIssuance).multipliedBy(annualInflationPercent);

    // noted: allCollatorsPool -> all candidate collators; selectedCollators -> candidate collators selected in current round
    const allCollatorsPoolInfo = _allCollatorsPool.toPrimitive() as unknown as PalletParachainStakingSetOrderedSet[];
    const allCollatorsPool = allCollatorsPoolInfo.map((collator) => collator.owner.toString());
    const selectedCollators = _selectedCollators.toPrimitive() as string[];
    const totalActiveCollators = selectedCollators.length;

    const bnCollatorExpectedBlocksPerRound = new BigN(round.length).dividedBy(allCollatorsPool.length);

    const maxDelegationPerCollator = apiProps.api.consts.parachainStaking.maxTopDelegationsPerCandidate.toString();
    const rawCollatorCommission = _collatorCommission.toHuman() as string;
    const collatorCommission = parseFloat(rawCollatorCommission.split('%')[0]);
    const collatorCommissionPercent = collatorCommission / 100;

    for (const collator of _allCollators) {
      const _collatorAddress = collator[0].toHuman() as string[];
      const collatorAddress = _collatorAddress[0];

      if (allCollatorsPool.includes(collatorAddress)) {
        const collatorInfo = collator[1].toPrimitive() as unknown as ParachainStakingCandidateMetadata;

        const bnTotalStake = new BN(collatorInfo.totalCounted);
        const bnOwnStake = new BN(collatorInfo.bond);
        const bnOtherStake = bnTotalStake.sub(bnOwnStake);
        const bnMinBond = new BN(collatorInfo.lowestTopDelegationAmount);
        const maxNominatorRewarded = parseInt(maxDelegationPerCollator);

        allCollators.push({
          commission: 0,
          address: collatorAddress,
          totalStake: bnTotalStake.toString(),
          ownStake: bnOwnStake.toString(),
          otherStake: bnOtherStake.toString(),
          nominatorCount: collatorInfo.delegationCount,
          blocked: false,
          isVerified: false,
          minBond: bnMinBond.toString(),
          chain: this.chain,
          isCrowded: collatorInfo.delegationCount ? collatorInfo.delegationCount >= maxNominatorRewarded : false
        });
      }
    }

    await Promise.all(allCollators.map(async (collator) => {
      if (allCollatorsPool.includes(collator.address)) {
        // noted: number of blocks = total points / points per block
        const _collatorPoints = await apiProps.api.query.parachainStaking.awardedPts(parseInt(round.current) - 1, collator.address);
        const collatorPoints = _collatorPoints.toPrimitive() as number;
        const blocksPreviousRound = collatorPoints / POINTS_PER_BLOCK;

        collator.expectedReturn = calculateMantaNominatorReturn(DECIMAL, collatorCommissionPercent, totalActiveCollators, bnAnnualInflation, blocksPreviousRound, bnCollatorExpectedBlocksPerRound, new BigN(collator.totalStake), false);
      }
    }));

    const extraInfoMap: Record<string, CollatorExtraInfo> = {};

    await Promise.all(allCollators.map(async (collator) => {
      const [_info, [identity, isReasonable]] = await Promise.all([
        apiProps.api.query.parachainStaking.candidateInfo(collator.address),
        parseIdentity(apiProps, collator.address)
      ]);

      const rawInfo = _info.toHuman() as Record<string, any>;

      const active = rawInfo?.status === 'Active';

      extraInfoMap[collator.address] = {
        identity,
        isVerified: isReasonable,
        active
      } as CollatorExtraInfo;
    }));

    for (const validator of allCollators) {
      validator.blocked = !extraInfoMap[validator.address].active;
      validator.identity = extraInfoMap[validator.address].identity;
      validator.isVerified = extraInfoMap[validator.address].isVerified;
      // @ts-ignore
      validator.commission = collatorCommission;
    }

    return allCollators;
  }

  async getParachainPoolTargets (): Promise<ValidatorInfo[]> {
    const apiProps = await this.substrateApi.isReady;
    const allCollators: ValidatorInfo[] = [];

    const [_allCollators, _collatorCommission] = await Promise.all([
      apiProps.api.query.parachainStaking.candidateInfo.entries(),
      apiProps.api.query.parachainStaking.collatorCommission()
    ]);

    const maxDelegationPerCollator = apiProps.api.consts.parachainStaking.maxTopDelegationsPerCandidate.toString();
    const rawCollatorCommission = _collatorCommission.toHuman() as string;
    const collatorCommission = parseFloat(rawCollatorCommission.split('%')[0]);

    for (const collator of _allCollators) {
      const _collatorAddress = collator[0].toHuman() as string[];
      const collatorAddress = _collatorAddress[0];
      const collatorInfo = collator[1].toPrimitive() as unknown as ParachainStakingCandidateMetadata;

      const bnTotalStake = new BN(collatorInfo.totalCounted);
      const bnOwnStake = new BN(collatorInfo.bond);
      const bnOtherStake = bnTotalStake.sub(bnOwnStake);
      const bnMinBond = new BN(collatorInfo.lowestTopDelegationAmount);
      const maxNominatorRewarded = parseInt(maxDelegationPerCollator);

      allCollators.push({
        commission: 0,
        expectedReturn: 0,
        address: collatorAddress,
        totalStake: bnTotalStake.toString(),
        ownStake: bnOwnStake.toString(),
        otherStake: bnOtherStake.toString(),
        nominatorCount: collatorInfo.delegationCount,
        blocked: false,
        isVerified: false,
        minBond: bnMinBond.toString(),
        chain: this.chain,
        isCrowded: collatorInfo.delegationCount ? collatorInfo.delegationCount >= maxNominatorRewarded : false
      });
    }

    const extraInfoMap: Record<string, CollatorExtraInfo> = {};

    await Promise.all(allCollators.map(async (collator) => {
      const [_info, [identity, isReasonable]] = await Promise.all([
        apiProps.api.query.parachainStaking.candidateInfo(collator.address),
        parseIdentity(apiProps, collator.address)
      ]);

      const rawInfo = _info.toHuman() as Record<string, any>;

      const active = rawInfo?.status === 'Active';

      extraInfoMap[collator.address] = {
        identity,
        isVerified: isReasonable,
        active
      } as CollatorExtraInfo;
    }));

    for (const validator of allCollators) {
      validator.blocked = !extraInfoMap[validator.address].active;
      validator.identity = extraInfoMap[validator.address].identity;
      validator.isVerified = extraInfoMap[validator.address].isVerified;
      // @ts-ignore
      validator.commission = collatorCommission;
    }

    return allCollators;
  }

  async getPoolTargets (): Promise<ValidatorInfo[]> {
    if (_STAKING_CHAIN_GROUP.manta.includes(this.chain)) {
      return this.getMantaPoolTargets();
    } else {
      return this.getParachainPoolTargets();
    }
  }

  /* Get pool targets */

  /* Join pool action */

  async createJoinExtrinsic (data: SubmitJoinNativeStaking, positionInfo?: YieldPositionInfo): Promise<[TransactionData, YieldTokenBaseInfo]> {
    const { amount, selectedValidators } = data;
    const apiPromise = await this.substrateApi.isReady;
    const binaryAmount = new BN(amount);
    const selectedCollatorInfo = selectedValidators[0];

    // eslint-disable-next-line @typescript-eslint/require-await
    const compoundResult = async (extrinsic: SubmittableExtrinsic<'promise'>): Promise<[TransactionData, YieldTokenBaseInfo]> => {
      const tokenSlug = this.nativeToken.slug;
      // const feeInfo = await extrinsic.paymentInfo(address);
      // const fee = feeInfo.toPrimitive() as unknown as RuntimeDispatchInfo;

      // Not use the fee to validate and to display on UI
      return [extrinsic, { slug: tokenSlug, amount: '0' }];
    };

    if (!positionInfo) {
      const extrinsic = apiPromise.api.tx.parachainStaking.delegate(selectedCollatorInfo.address, binaryAmount, new BN(selectedCollatorInfo.nominatorCount), 0);

      return compoundResult(extrinsic);
    }

    const { bondedValidators, nominationCount } = getBondedValidators(positionInfo.nominations);
    const parsedSelectedCollatorAddress = reformatAddress(selectedCollatorInfo.address, 0);

    if (!bondedValidators.includes(parsedSelectedCollatorAddress)) {
      const extrinsic = apiPromise.api.tx.parachainStaking.delegate(selectedCollatorInfo.address, binaryAmount, new BN(selectedCollatorInfo.nominatorCount), nominationCount);

      return compoundResult(extrinsic);
    } else {
      const extrinsic = apiPromise.api.tx.parachainStaking.delegatorBondMore(selectedCollatorInfo.address, binaryAmount);

      return compoundResult(extrinsic);
    }
  }

  /* Join pool action */

  /* Leave pool action */

  async handleYieldUnstake (amount: string, address: string, selectedTarget?: string): Promise<[ExtrinsicType, TransactionData]> {
    const apiPromise = await this.substrateApi.isReady;
    const binaryAmount = new BN(amount);
    const poolPosition = await this.getPoolPosition(address);

    if (!selectedTarget || !poolPosition) {
      return Promise.reject(new TransactionError(BasicTxErrorType.INVALID_PARAMS));
    }

    const unstakeAll = isUnstakeAll(selectedTarget, poolPosition.nominations, amount);

    let extrinsic: TransactionData;

    if (!unstakeAll) {
      extrinsic = apiPromise.api.tx.parachainStaking.scheduleDelegatorBondLess(selectedTarget, binaryAmount);
    } else {
      extrinsic = apiPromise.api.tx.parachainStaking.scheduleRevokeDelegation(selectedTarget);
    }

    return [ExtrinsicType.STAKING_LEAVE_POOL, extrinsic];
  }

  /* Leave pool action */

  /* Other action */

  async handleYieldCancelUnstake (params: StakeCancelWithdrawalParams): Promise<TransactionData> {
    const { selectedUnstaking } = params;
    const chainApi = await this.substrateApi.isReady;

    return chainApi.api.tx.parachainStaking.cancelDelegationRequest(selectedUnstaking.validatorAddress);
  }

  async handleYieldWithdraw (address: string, unstakingInfo: UnstakingInfo): Promise<TransactionData> {
    const collatorAddress = unstakingInfo.validatorAddress;

    if (!collatorAddress) {
      return Promise.reject(new TransactionError(BasicTxErrorType.INVALID_PARAMS));
    }

    const chainApi = await this.substrateApi.isReady;

    return chainApi.api.tx.parachainStaking.executeDelegationRequest(address, collatorAddress);
  }

  /* Other actions */
}
