// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { BasicTxErrorType, ExtrinsicType, NominationInfo, StakeCancelWithdrawalParams, StakingTxErrorType, StakingType, UnstakingInfo, YieldStepType } from '@subwallet/extension-base/background/KoniTypes';
import { getBondedValidators, getExistUnstakeErrorMessage, getMaxValidatorErrorMessage, getMinStakeErrorMessage, getParaCurrentInflation, getStakingStatusByNominations, InflationConfig, isUnstakeAll } from '@subwallet/extension-base/koni/api/staking/bonding/utils';
import { DEFAULT_YIELD_FIRST_STEP, syntheticSelectedValidators } from '@subwallet/extension-base/koni/api/yield/helper/utils';
import { _STAKING_ERA_LENGTH_MAP } from '@subwallet/extension-base/services/chain-service/constants';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getChainNativeTokenSlug } from '@subwallet/extension-base/services/chain-service/utils';
import { fakeAddress } from '@subwallet/extension-base/services/earning-service/constants';
import BaseNativeStakingPoolHandler from '@subwallet/extension-base/services/earning-service/handlers/native-staking/base';
import { parseIdentity } from '@subwallet/extension-base/services/earning-service/utils';
import { CollatorExtraInfo, EarningStatus, NormalYieldPoolInfo, OptimalYieldPath, OptimalYieldPathParams, PalletParachainStakingDelegationRequestsScheduledRequest, PalletParachainStakingDelegator, ParachainStakingCandidateMetadata, RuntimeDispatchInfo, SubmitJoinNativeStaking, SubmitYieldJoinData, TransactionData, UnstakingStatus, ValidatorInfo, YieldPoolInfo, YieldPositionInfo } from '@subwallet/extension-base/types';
import { balanceFormatter, formatNumber, isSameAddress, parseRawNumber, reformatAddress } from '@subwallet/extension-base/utils';

import { UnsubscribePromise } from '@polkadot/api-base/types/base';
import { Codec } from '@polkadot/types/types';
import { BN, BN_ZERO } from '@polkadot/util';

export default class ParaNativeStakingPoolHandler extends BaseNativeStakingPoolHandler {
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

    const stakingStatus = getStakingStatusByNominations(bnTotalActiveStake, nominationList);

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

  // Todo
  async generateOptimalPath (params: OptimalYieldPathParams): Promise<OptimalYieldPath> {
    const bnAmount = new BN(params.amount);
    const result: OptimalYieldPath = {
      totalFee: [],
      steps: [DEFAULT_YIELD_FIRST_STEP]
    };

    const feeAsset = this.nativeToken.slug;
    const substrateApi = await this.substrateApi.isReady;

    result.steps.push({
      id: result.steps.length,
      name: 'Nominate validators',
      type: YieldStepType.NOMINATE
    });

    const [_bondFeeInfo, _nominateFeeInfo] = await Promise.all([
      substrateApi.api.tx.staking.bond(bnAmount, 'Staked').paymentInfo(fakeAddress),
      substrateApi.api.tx.staking.nominate(syntheticSelectedValidators).paymentInfo(fakeAddress)
    ]);

    const bondFeeInfo = _bondFeeInfo.toPrimitive() as unknown as RuntimeDispatchInfo;
    const nominateFeeInfo = _nominateFeeInfo.toPrimitive() as unknown as RuntimeDispatchInfo;

    const totalFee = bondFeeInfo.partialFee + nominateFeeInfo.partialFee;

    result.totalFee.push({
      slug: feeAsset,
      amount: totalFee.toString()
    });

    return result;
  }

  async validateYieldJoin (data: SubmitYieldJoinData, path: OptimalYieldPath): Promise<TransactionError[]> {
    const { address, amount, selectedValidators } = data as SubmitJoinNativeStaking;
    const poolInfo = await this.getPoolInfo();
    const poolPosition = await this.getPoolPosition(address);
    const chainInfo = this.chainInfo;

    if (!poolInfo) {
      return Promise.resolve([new TransactionError(BasicTxErrorType.INTERNAL_ERROR)]);
    }

    const errors: TransactionError[] = [];
    const selectedCollator = selectedValidators[0];
    let bnTotalStake = new BN(amount);
    const bnChainMinStake = new BN(poolInfo.metadata.minJoinPool || '0');
    const bnCollatorMinStake = new BN(selectedCollator.minBond || '0');
    const bnMinStake = bnCollatorMinStake > bnChainMinStake ? bnCollatorMinStake : bnChainMinStake;
    const minStakeErrorMessage = getMinStakeErrorMessage(chainInfo, bnMinStake);
    const maxValidator = poolInfo.metadata.maxCandidatePerFarmer;
    const maxValidatorErrorMessage = getMaxValidatorErrorMessage(chainInfo, maxValidator);
    const existUnstakeErrorMessage = getExistUnstakeErrorMessage(chainInfo.slug, StakingType.NOMINATED, true);

    if (!poolPosition || poolPosition.status === EarningStatus.NOT_STAKING) {
      if (!bnTotalStake.gte(bnMinStake)) {
        errors.push(new TransactionError(StakingTxErrorType.NOT_ENOUGH_MIN_STAKE, minStakeErrorMessage));
      }

      return errors;
    }

    const { bondedValidators } = getBondedValidators(poolPosition.nominations);
    const parsedSelectedCollatorAddress = reformatAddress(selectedCollator.address, 0);

    if (!bondedValidators.includes(parsedSelectedCollatorAddress)) { // new delegation
      if (!bnTotalStake.gte(bnMinStake)) {
        errors.push(new TransactionError(StakingTxErrorType.NOT_ENOUGH_MIN_STAKE, minStakeErrorMessage));
      }

      const delegationCount = poolPosition.nominations.length + 1;

      if (delegationCount > maxValidator) {
        errors.push(new TransactionError(StakingTxErrorType.EXCEED_MAX_NOMINATIONS, maxValidatorErrorMessage));
      }
    } else {
      let currentDelegationAmount = '0';
      let hasUnstaking = false;

      for (const delegation of poolPosition.nominations) {
        if (reformatAddress(delegation.validatorAddress, 0) === parsedSelectedCollatorAddress) {
          currentDelegationAmount = delegation.activeStake;
          hasUnstaking = !!delegation.hasUnstaking && delegation.hasUnstaking;

          break;
        }
      }

      bnTotalStake = bnTotalStake.add(new BN(currentDelegationAmount));

      if (!bnTotalStake.gte(bnMinStake)) {
        errors.push(new TransactionError(StakingTxErrorType.NOT_ENOUGH_MIN_STAKE, minStakeErrorMessage));
      }

      if (hasUnstaking) {
        errors.push(new TransactionError(StakingTxErrorType.EXIST_UNSTAKING_REQUEST, existUnstakeErrorMessage));
      }
    }

    return errors;
  }

  async createJoinExtrinsic (data: SubmitJoinNativeStaking, positionInfo?: YieldPositionInfo): Promise<TransactionData> {
    const { amount, selectedValidators } = data;
    const apiPromise = await this.substrateApi.isReady;
    const binaryAmount = new BN(amount);
    const selectedCollatorInfo = selectedValidators[0];

    if (!positionInfo) {
      return apiPromise.api.tx.parachainStaking.delegate(selectedCollatorInfo.address, binaryAmount, new BN(selectedCollatorInfo.nominatorCount), 0);
    }

    const { bondedValidators, nominationCount } = getBondedValidators(positionInfo.nominations);
    const parsedSelectedCollatorAddress = reformatAddress(selectedCollatorInfo.address, 0);

    if (!bondedValidators.includes(parsedSelectedCollatorAddress)) {
      return apiPromise.api.tx.parachainStaking.delegate(selectedCollatorInfo.address, binaryAmount, new BN(selectedCollatorInfo.nominatorCount), nominationCount);
    } else {
      return apiPromise.api.tx.parachainStaking.delegatorBondMore(selectedCollatorInfo.address, binaryAmount);
    }
  }

  /* Join pool action */

  /* Leave pool action */

  /**
   * @todo Recheck
   * */
  async validateYieldLeave (amount: string, address: string, fastLeave: boolean, selectedTarget?: string): Promise<TransactionError[]> {
    const errors: TransactionError[] = [];

    const poolInfo = await this.getPoolInfo();
    const poolPosition = await this.getPoolPosition(address);

    if (!poolInfo || !poolPosition || fastLeave || !selectedTarget) {
      return [new TransactionError(BasicTxErrorType.INTERNAL_ERROR)];
    }

    if (fastLeave) {
      return [new TransactionError(BasicTxErrorType.INVALID_PARAMS)];
    }

    let targetNomination: NominationInfo | undefined;

    for (const nomination of poolPosition.nominations) {
      if (isSameAddress(nomination.validatorAddress, selectedTarget)) {
        targetNomination = nomination;

        break;
      }
    }

    if (!targetNomination) {
      errors.push(new TransactionError(BasicTxErrorType.INTERNAL_ERROR));

      return errors;
    }

    const bnActiveStake = new BN(targetNomination.activeStake);
    const bnRemainingStake = bnActiveStake.sub(new BN(amount));

    const bnChainMinStake = new BN(poolInfo.metadata.minJoinPool || '0');
    const bnCollatorMinStake = new BN(targetNomination.validatorMinStake || '0');
    const bnMinStake = BN.max(bnCollatorMinStake, bnChainMinStake);
    const existUnstakeErrorMessage = getExistUnstakeErrorMessage(this.chain, StakingType.NOMINATED);

    if (targetNomination.hasUnstaking) {
      errors.push(new TransactionError(StakingTxErrorType.EXIST_UNSTAKING_REQUEST, existUnstakeErrorMessage));
    }

    if (!(bnRemainingStake.isZero() || bnRemainingStake.gte(bnMinStake))) {
      errors.push(new TransactionError(StakingTxErrorType.INVALID_ACTIVE_STAKE));
    }

    return errors;
  }

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

  // Todo
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
