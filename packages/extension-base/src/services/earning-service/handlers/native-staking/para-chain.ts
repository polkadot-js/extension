// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { BasicTxErrorType, ExtrinsicType, NominationInfo, UnstakingInfo } from '@subwallet/extension-base/background/KoniTypes';
import { getBondedValidators, getEarningStatusByNominations, getParaCurrentInflation, InflationConfig, isUnstakeAll } from '@subwallet/extension-base/koni/api/staking/bonding/utils';
import { _STAKING_ERA_LENGTH_MAP } from '@subwallet/extension-base/services/chain-service/constants';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getChainNativeTokenSlug } from '@subwallet/extension-base/services/chain-service/utils';
import { parseIdentity } from '@subwallet/extension-base/services/earning-service/utils';
import { CollatorExtraInfo, EarningStatus, NormalYieldPoolInfo, PalletParachainStakingDelegationRequestsScheduledRequest, PalletParachainStakingDelegator, ParachainStakingCandidateMetadata, RuntimeDispatchInfo, StakeCancelWithdrawalParams, SubmitJoinNativeStaking, TransactionData, UnstakingStatus, ValidatorInfo, YieldPoolInfo, YieldPositionInfo, YieldTokenBaseInfo } from '@subwallet/extension-base/types';
import { balanceFormatter, formatNumber, parseRawNumber, reformatAddress } from '@subwallet/extension-base/utils';

import { SubmittableExtrinsic } from '@polkadot/api/types';
import { UnsubscribePromise } from '@polkadot/api-base/types/base';
import { Codec } from '@polkadot/types/types';
import { BN, BN_ZERO } from '@polkadot/util';

import BaseParaNativeStakingPoolHandler from './base-para';

export default class ParaNativeStakingPoolHandler extends BaseParaNativeStakingPoolHandler {
  /* Subscribe pool info */

  async subscribePoolInfo (callback: (data: YieldPoolInfo) => void): Promise<VoidFunction> {
    let cancel = false;
    const chainApi = this.substrateApi;
    const chainInfo = this.chainInfo;
    const nativeToken = this.nativeToken;
    const defaultData = this.defaultInfo;

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

      let _unvestedAllocation;

      if (chainApi.api.query.vesting && chainApi.api.query.vesting.totalUnvestedAllocation) {
        _unvestedAllocation = await chainApi.api.query.vesting.totalUnvestedAllocation();
      }

      const [_totalStake, _totalIssuance, _inflation] = await Promise.all([
        chainApi.api.query.parachainStaking.staked(round),
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
      const unstakingPeriod = parseInt(unstakingDelay) * (_STAKING_ERA_LENGTH_MAP[this.chain] || _STAKING_ERA_LENGTH_MAP.default);
      const minStake = '0';
      const minToHuman = formatNumber(minStake.toString(), nativeToken.decimals || 0, balanceFormatter);

      const data: NormalYieldPoolInfo = {
        // TODO
        ...defaultData,
        description: this.description.replaceAll('{{amount}}', minToHuman),
        type: this.type,
        metadata: {
          isAvailable: true,
          maxCandidatePerFarmer: parseInt(maxDelegations),
          maxWithdrawalRequestPerFarmer: 1, // by default
          minJoinPool: minStake.toString(),
          farmerCount: 0, // TODO recheck
          era: round,
          assetEarning: [
            {
              slug: _getChainNativeTokenSlug(chainInfo)
            }
          ],
          totalApy: undefined, // not have
          tvl: totalStake.toString(),
          unstakingPeriod: unstakingPeriod,
          allowCancelUnstaking: true,
          inflation,
          minWithdrawal: '0'
        }
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

  async parseNominatorMetadata (chainInfo: _ChainInfo, address: string, substrateApi: _SubstrateApi, delegatorState: PalletParachainStakingDelegator): Promise<Pick<YieldPositionInfo, 'activeStake' | 'balance' | 'isBondedBefore' | 'nominations' | 'status' | 'unstakings'>> {
    const nominationList: NominationInfo[] = [];
    const unstakingMap: Record<string, UnstakingInfo> = {};

    let bnTotalActiveStake = BN_ZERO;

    const _roundInfo = await substrateApi.api.query.parachainStaking.round();
    const roundInfo = _roundInfo.toPrimitive() as Record<string, number>;
    const currentRound = roundInfo.current;

    await Promise.all(delegatorState.delegations.map(async (delegation) => {
      const [_delegationScheduledRequests, [identity], _collatorInfo] = await Promise.all([
        substrateApi.api.query.parachainStaking.delegationScheduledRequests(delegation.owner),
        parseIdentity(substrateApi, delegation.owner),
        substrateApi.api.query.parachainStaking.candidateInfo(delegation.owner)
      ]);

      const collatorInfo = _collatorInfo.toPrimitive() as unknown as ParachainStakingCandidateMetadata;
      const minDelegation = collatorInfo?.lowestTopDelegationAmount.toString();
      const delegationScheduledRequests = _delegationScheduledRequests.toPrimitive() as unknown as PalletParachainStakingDelegationRequestsScheduledRequest[];

      let hasUnstaking = false;
      let delegationStatus: EarningStatus = EarningStatus.NOT_EARNING;

      // parse unstaking info
      if (delegationScheduledRequests) {
        for (const scheduledRequest of delegationScheduledRequests) {
          if (reformatAddress(scheduledRequest.delegator, 0) === reformatAddress(address, 0)) { // add network prefix
            const isClaimable = scheduledRequest.whenExecutable - currentRound < 0;
            const remainingEra = scheduledRequest.whenExecutable - currentRound;
            const waitingTime = remainingEra * _STAKING_ERA_LENGTH_MAP[chainInfo.slug];
            const claimable = Object.values(scheduledRequest.action)[0];

            unstakingMap[delegation.owner] = {
              chain: chainInfo.slug,
              status: isClaimable ? UnstakingStatus.CLAIMABLE : UnstakingStatus.UNLOCKING,
              validatorAddress: delegation.owner,
              claimable: claimable.toString(),
              waitingTime
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

    const activeStake = bnTotalActiveStake.toString();

    return {
      status: stakingStatus,
      balance: [{
        slug: this.nativeToken.slug,
        activeBalance: activeStake
      }],
      isBondedBefore: !!nominationList.length,
      activeStake: activeStake,
      nominations: nominationList,
      unstakings: Object.values(unstakingMap)
    };
  }

  async subscribePoolPosition (useAddresses: string[], resultCallback: (rs: YieldPositionInfo) => void): Promise<VoidFunction> {
    let cancel = false;
    const substrateApi = this.substrateApi;
    const nativeToken = this.nativeToken;
    const defaultInfo = this.defaultInfo;
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
              balance: [
                {
                  slug: nativeToken.slug,
                  activeBalance: '0'
                }
              ],
              status: EarningStatus.NOT_STAKING,
              activeStake: '0',
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

  async getPoolTargets (): Promise<ValidatorInfo[]> {
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
        isCrowded: parseInt(maxDelegationPerCollator) > 0
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

  /* Get pool targets */

  /* Join pool action */

  async createJoinExtrinsic (data: SubmitJoinNativeStaking, positionInfo?: YieldPositionInfo): Promise<[TransactionData, YieldTokenBaseInfo]> {
    const { address, amount, selectedValidators } = data;
    const apiPromise = await this.substrateApi.isReady;
    const binaryAmount = new BN(amount);
    const selectedCollatorInfo = selectedValidators[0];

    const compoundResult = async (extrinsic: SubmittableExtrinsic<'promise'>): Promise<[TransactionData, YieldTokenBaseInfo]> => {
      const tokenSlug = this.nativeToken.slug;
      const feeInfo = await extrinsic.paymentInfo(address);
      const fee = feeInfo.toPrimitive() as unknown as RuntimeDispatchInfo;

      return [extrinsic, { slug: tokenSlug, amount: fee.partialFee.toString() }];
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
