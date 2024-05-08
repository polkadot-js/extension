// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { APIItemState, BasicTxErrorType, ExtrinsicType, NominationInfo, UnstakingInfo } from '@subwallet/extension-base/background/KoniTypes';
import { getBondedValidators, getEarningStatusByNominations, isUnstakeAll, KrestDelegateState } from '@subwallet/extension-base/koni/api/staking/bonding/utils';
import { _STAKING_ERA_LENGTH_MAP } from '@subwallet/extension-base/services/chain-service/constants';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _STAKING_CHAIN_GROUP } from '@subwallet/extension-base/services/earning-service/constants';
import { parseIdentity } from '@subwallet/extension-base/services/earning-service/utils';
import { BaseYieldPositionInfo, EarningRewardItem, EarningStatus, NativeYieldPoolInfo, ParachainStakingStakeOption, StakeCancelWithdrawalParams, SubmitJoinNativeStaking, TransactionData, UnstakingStatus, ValidatorInfo, YieldPoolInfo, YieldPositionInfo, YieldStepBaseInfo, YieldStepType, YieldTokenBaseInfo } from '@subwallet/extension-base/types';
import { balanceFormatter, formatNumber, parseRawNumber, reformatAddress } from '@subwallet/extension-base/utils';

import { SubmittableExtrinsic } from '@polkadot/api/types';
import { UnsubscribePromise } from '@polkadot/api-base/types/base';
import { Codec } from '@polkadot/types/types';
import { BN, BN_ZERO } from '@polkadot/util';

import BaseParaNativeStakingPoolHandler from './base-para';

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
  delegators: AmplitudeDelegateInfo[],
  total: string,
  status: string | Record<string, string>
}

interface AmplitudeDelegateInfo {
  owner: string,
  amount: string
}

interface CollatorStakeInfo {
  collators: string;
  delegators: string;
}

export default class AmplitudeNativeStakingPoolHandler extends BaseParaNativeStakingPoolHandler {
  /* Subscribe pool info */

  async subscribePoolInfo (callback: (data: YieldPoolInfo) => void): Promise<VoidFunction> {
    let cancel = false;
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

    const substrateApi = await this.substrateApi.isReady;

    const unsub = await (substrateApi.api.query.parachainStaking.round(async (_round: Codec) => {
      if (cancel) {
        unsub();

        return;
      }

      const roundObj = _round.toHuman() as Record<string, string>;
      const round = parseRawNumber(roundObj.current);
      const maxDelegations = substrateApi.api.consts.parachainStaking.maxDelegationsPerRound.toString();
      const minDelegatorStake = substrateApi.api.consts.parachainStaking.minDelegatorStake.toString();
      const unstakingDelay = substrateApi.api.consts.parachainStaking.stakeDuration.toString(); // in blocks
      const _blockPerRound = substrateApi.api.consts.parachainStaking.defaultBlocksPerRound.toString();
      const maxUnstakeRequests = substrateApi.api.consts.parachainStaking.maxUnstakeRequests.toPrimitive() as number;
      const maxDelegatorsPerCollator = substrateApi.api.consts.parachainStaking.maxDelegatorsPerCollator?.toString();
      const blockPerRound = parseFloat(_blockPerRound);

      const roundTime = _STAKING_ERA_LENGTH_MAP[this.chain] || _STAKING_ERA_LENGTH_MAP.default; // in hours
      const blockDuration = roundTime / blockPerRound; // in hours
      const unstakingPeriod = blockDuration * parseInt(unstakingDelay);
      const minToHuman = formatNumber(minDelegatorStake, nativeToken.decimals || 0, balanceFormatter);
      const delegatorStorages = await substrateApi.api.query.parachainStaking.delegatorState.keys();
      const staked = await substrateApi.api.query.parachainStaking.totalCollatorStake();
      const stakeInfo = staked.toPrimitive() as unknown as CollatorStakeInfo;

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
          maxWithdrawalRequestPerFarmer: maxUnstakeRequests, // by default
          earningThreshold: {
            join: minDelegatorStake,
            defaultUnstake: '0',
            fastUnstake: '0'
          },
          farmerCount: delegatorStorages.length, // One delegator (farmer) - One collator (candidate) - on storage
          era: round,
          eraTime: roundTime,
          tvl: stakeInfo.delegators, // TODO recheck
          totalApy: undefined, // TODO recheck
          unstakingPeriod
        },
        maxPoolMembers: maxDelegatorsPerCollator ? parseInt(maxDelegatorsPerCollator) : undefined
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

  async parseNominatorMetadata (chainInfo: _ChainInfo, address: string, substrateApi: _SubstrateApi, delegatorState: ParachainStakingStakeOption[], unstakingInfo: Record<string, number>): Promise<Omit<YieldPositionInfo, keyof BaseYieldPositionInfo>> {
    const nominationList: NominationInfo[] = [];
    const unstakingList: UnstakingInfo[] = [];
    const minDelegatorStake = substrateApi.api.consts.parachainStaking.minDelegatorStake.toString();
    const hasUnstakingInfo = unstakingInfo && Object.values(unstakingInfo).length > 0;

    let activeStake = '0';
    let unstakingBalance = '0';

    if (delegatorState) { // delegatorState can be null while unstaking all
      const identityPromises = delegatorState.map((delegate) => parseIdentity(substrateApi, delegate.owner));
      const identities = await Promise.all(identityPromises);

      for (let i = 0; i < delegatorState.length; i++) {
        const delegate = delegatorState[i];
        const [identity] = identities[i];

        activeStake = delegate.amount.toString();
        const bnActiveStake = new BN(activeStake);
        let delegationStatus = EarningStatus.NOT_EARNING;

        if (bnActiveStake.gt(BN_ZERO) && bnActiveStake.gte(new BN(minDelegatorStake))) {
          delegationStatus = EarningStatus.EARNING_REWARD;
        }

        nominationList.push({
          status: delegationStatus,
          chain: chainInfo.slug,
          validatorAddress: delegate.owner,
          activeStake: delegate.amount.toString(),
          validatorMinStake: '0',
          hasUnstaking: hasUnstakingInfo,
          validatorIdentity: identity
        });
      }

      if (hasUnstakingInfo) {
        const [_currentBlock, _currentTimestamp] = await Promise.all([
          substrateApi.api.query.system.number(),
          substrateApi.api.query.timestamp.now()
        ]);

        const currentBlock = _currentBlock.toPrimitive() as number;
        const currentTimestamp = _currentTimestamp.toPrimitive() as number;

        const _blockPerRound = substrateApi.api.consts.parachainStaking.defaultBlocksPerRound.toString();
        const blockPerRound = parseFloat(_blockPerRound);

        for (const [unstakingBlock, unstakingAmount] of Object.entries(unstakingInfo)) {
          const blockDuration = (_STAKING_ERA_LENGTH_MAP[chainInfo.slug] || _STAKING_ERA_LENGTH_MAP.default) / blockPerRound; // in hours

          const isClaimable = parseInt(unstakingBlock) - currentBlock <= 0;
          const remainingBlock = parseInt(unstakingBlock) - currentBlock;
          const waitingTime = remainingBlock * blockDuration;

          const targetTimestampMs = remainingBlock * blockDuration * 3600 * 1000 + currentTimestamp;

          unstakingBalance = unstakingAmount.toString();

          unstakingList.push({
            chain: chainInfo.slug,
            status: isClaimable ? UnstakingStatus.CLAIMABLE : UnstakingStatus.UNLOCKING,
            claimable: unstakingAmount.toString(),
            waitingTime,
            targetTimestampMs: targetTimestampMs,
            validatorAddress: undefined
          });
        }
      }
    }

    const totalBalance = new BN(activeStake).add(new BN(unstakingBalance));
    const stakingStatus = getEarningStatusByNominations(new BN(activeStake), nominationList);

    return {
      status: stakingStatus,
      balanceToken: this.nativeToken.slug,
      totalStake: totalBalance.toString(),
      activeStake: activeStake,
      unstakeBalance: unstakingBalance,
      isBondedBefore: true,
      nominations: nominationList,
      unstakings: unstakingList
    };
  }

  async subscribePoolPosition (useAddresses: string[], resultCallback: (rs: YieldPositionInfo) => void): Promise<VoidFunction> {
    let cancel = false;
    const substrateApi = await this.substrateApi.isReady;
    const defaultInfo = this.baseInfo;
    const chainInfo = this.chainInfo;

    const unsub = await substrateApi.api.query.parachainStaking.delegatorState.multi(useAddresses, async (ledgers: Codec[]) => {
      if (cancel) {
        unsub();

        return;
      }

      if (ledgers) {
        const _unstakingStates = await substrateApi.api.query.parachainStaking.unstaking.multi(useAddresses);

        await Promise.all(ledgers.map(async (_delegatorState, i) => {
          const owner = reformatAddress(useAddresses[i], 42);
          let delegatorState: ParachainStakingStakeOption[] = [];

          const unstakingInfo = _unstakingStates[i].toPrimitive() as unknown as Record<string, number>;

          if (_STAKING_CHAIN_GROUP.krest_network.includes(this.chain)) {
            const krestDelegatorState = _delegatorState.toPrimitive() as unknown as KrestDelegateState;

            const delegates = krestDelegatorState?.delegations as unknown as ParachainStakingStakeOption[];

            if (delegates) {
              delegatorState = delegatorState.concat(delegates);
            }
          } else {
            const delegate = _delegatorState.toPrimitive() as unknown as ParachainStakingStakeOption;

            if (delegate) {
              delegatorState.push(delegate);
            }
          }

          if (!delegatorState && !unstakingInfo) {
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
          } else {
            const nominatorMetadata = await this.parseNominatorMetadata(chainInfo, owner, substrateApi, delegatorState, unstakingInfo);

            resultCallback({
              ...defaultInfo,
              ...nominatorMetadata,
              address: owner,
              type: this.type
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

  /* Get pool reward */

  override async getPoolReward (useAddresses: string[], callBack: (rs: EarningRewardItem) => void): Promise<VoidFunction> {
    let cancel = false;
    const substrateApi = this.substrateApi;

    await substrateApi.isReady;

    if (!_STAKING_CHAIN_GROUP.kilt.includes(this.chain) && !_STAKING_CHAIN_GROUP.krest_network.includes(this.chain)) {
      await Promise.all(useAddresses.map(async (address) => {
        const _unclaimedReward = await substrateApi.api.query.parachainStaking.rewards(address);

        if (cancel) {
          return;
        }

        callBack({
          ...this.baseInfo,
          address: address,
          type: this.type,
          unclaimedReward: _unclaimedReward.toString(),
          state: APIItemState.READY
        });
      }));
    }

    return () => {
      cancel = false;
    };
  }

  /* Get pool reward */

  /* Get pool targets */

  async getKrestPoolTargets (chainApi: _SubstrateApi): Promise<ValidatorInfo[]> {
    const _allCollators = await chainApi.api.query.parachainStaking.candidatePool.entries();
    const minDelegatorStake = chainApi.api.consts.parachainStaking.minDelegatorStake.toString();
    const maxDelegatorsPerCollator = chainApi.api.consts.parachainStaking.maxDelegatorsPerCollator?.toString();

    const identityPromises = _allCollators.map((collator) => {
      const collatorInfo = collator[1].toPrimitive() as unknown as CollatorInfo;
      const address = collatorInfo.id;

      return parseIdentity(chainApi, address);
    });
    const identities = await Promise.all(identityPromises);

    return _allCollators.map((_collator, i) => {
      const [identity] = identities[i];
      const collatorInfo = _collator[1].toPrimitive() as unknown as CollatorInfo;

      const bnTotalStake = new BN(collatorInfo.total);
      const bnOwnStake = new BN(collatorInfo.stake);
      const bnOtherStake = bnTotalStake.sub(bnOwnStake);

      const isFullDelegatorsSet = collatorInfo.delegators.length >= parseInt(maxDelegatorsPerCollator);

      let minDelegate = new BN(minDelegatorStake);

      if (isFullDelegatorsSet) {
        const delegatorAmounts = collatorInfo.delegators.map((delegator) => new BN(delegator.amount));
        const sortedAmounts = delegatorAmounts.sort((a, b) => a.cmp(b));

        const minDelegateInSet = sortedAmounts[0];

        minDelegate = minDelegate.lt(minDelegateInSet) ? minDelegateInSet : minDelegate;
      }

      return {
        address: collatorInfo.id,
        totalStake: bnTotalStake.toString(),
        ownStake: bnOwnStake.toString(),
        otherStake: bnOtherStake.toString(),
        nominatorCount: collatorInfo.delegators.length,
        commission: 0,
        blocked: false,
        isVerified: false,
        minBond: minDelegate.toString(),
        chain: this.chain,
        isCrowded: isFullDelegatorsSet,
        identity
      } as ValidatorInfo;
    });
  }

  async getOtherPoolTargets (chainApi: _SubstrateApi): Promise<ValidatorInfo[]> {
    const [_allCollators, _inflationConfig] = await Promise.all([
      chainApi.api.query.parachainStaking.candidatePool.entries(),
      chainApi.api.query.parachainStaking.inflationConfig()
    ]);

    const minDelegatorStake = chainApi.api.consts.parachainStaking.minDelegatorStake.toString();
    const maxDelegatorsPerCollator = chainApi.api.consts.parachainStaking.maxDelegatorsPerCollator.toString();
    const inflationConfig = _inflationConfig.toHuman() as unknown as InflationConfig;
    const rawDelegatorReturn = inflationConfig.delegator.rewardRate.annual;
    const delegatorReturn = parseFloat(rawDelegatorReturn.split('%')[0]);

    const identityPromises = _allCollators.map((collator) => {
      const collatorInfo = collator[1].toPrimitive() as unknown as CollatorInfo;
      const address = collatorInfo.id;

      return parseIdentity(chainApi, address);
    });
    const identities = await Promise.all(identityPromises);

    return _allCollators.map((_collator, i) => {
      const [identity] = identities[i];
      const collatorInfo = _collator[1].toPrimitive() as unknown as CollatorInfo;

      const bnTotalStake = new BN(collatorInfo.total);
      const bnOwnStake = new BN(collatorInfo.stake);
      const bnOtherStake = bnTotalStake.sub(bnOwnStake);

      const isFullDelegatorsSet = collatorInfo.delegators.length >= parseInt(maxDelegatorsPerCollator);

      let minDelegate = new BN(minDelegatorStake);

      if (isFullDelegatorsSet) {
        const delegatorAmounts = collatorInfo.delegators.map((delegator) => new BN(delegator.amount));
        const sortedAmounts = delegatorAmounts.sort((a, b) => a.cmp(b));

        const minDelegateInSet = sortedAmounts[0];

        minDelegate = minDelegate.lt(minDelegateInSet) ? minDelegateInSet : minDelegate;
      }

      return {
        address: collatorInfo.id,
        totalStake: bnTotalStake.toString(),
        ownStake: bnOwnStake.toString(),
        otherStake: bnOtherStake.toString(),
        nominatorCount: collatorInfo.delegators.length,
        commission: 0,
        expectedReturn: delegatorReturn,
        blocked: false,
        isVerified: false,
        minBond: minDelegate.toString(),
        chain: this.chain,
        isCrowded: isFullDelegatorsSet,
        identity
      } as ValidatorInfo;
    });
  }

  async getPoolTargets (): Promise<ValidatorInfo[]> {
    const chainApi = await this.substrateApi.isReady;

    if (_STAKING_CHAIN_GROUP.krest_network.includes(this.chain)) {
      return this.getKrestPoolTargets(chainApi);
    } else {
      return this.getOtherPoolTargets(chainApi);
    }
  }

  /* Get pool targets */

  /* Join pool action */

  override get defaultSubmitStep (): YieldStepBaseInfo {
    return [
      {
        name: 'Nominate collators',
        type: YieldStepType.NOMINATE
      },
      {
        slug: this.nativeToken.slug,
        amount: '0'
      }
    ];
  }

  async createJoinExtrinsic (data: SubmitJoinNativeStaking, positionInfo?: YieldPositionInfo, bondDest = 'Staked'): Promise<[TransactionData, YieldTokenBaseInfo]> {
    const { address, amount, selectedValidators: targetValidators } = data;
    const chainApi = await this.substrateApi.isReady;
    const binaryAmount = new BN(amount);
    const poolPosition = await this.getPoolPosition(address);
    const selectedValidatorInfo = targetValidators[0];

    // eslint-disable-next-line @typescript-eslint/require-await
    const compoundResult = async (extrinsic: SubmittableExtrinsic<'promise'>): Promise<[TransactionData, YieldTokenBaseInfo]> => {
      const tokenSlug = this.nativeToken.slug;
      // const feeInfo = await extrinsic.paymentInfo(address);
      // const fee = feeInfo.toPrimitive() as unknown as RuntimeDispatchInfo;

      // Not use the fee to validate and to display on UI
      return [extrinsic, { slug: tokenSlug, amount: '0' }];
    };

    if (!poolPosition) {
      const extrinsic = chainApi.api.tx.parachainStaking.joinDelegators(selectedValidatorInfo.address, binaryAmount);

      return compoundResult(extrinsic);
    }

    const { bondedValidators } = getBondedValidators(poolPosition.nominations);

    if (!bondedValidators.includes(reformatAddress(selectedValidatorInfo.address, 0))) {
      const extrinsic = chainApi.api.tx.parachainStaking.joinDelegators(selectedValidatorInfo.address, binaryAmount);

      return compoundResult(extrinsic);
    } else {
      const _params = chainApi.api.tx.parachainStaking.delegatorStakeMore.toJSON() as Record<string, any>;
      const paramsCount = (_params.args as any[]).length;

      if (paramsCount === 2) { // detect number of params
        const extrinsic = chainApi.api.tx.parachainStaking.delegatorStakeMore(selectedValidatorInfo.address, binaryAmount);

        return compoundResult(extrinsic);
      } else {
        const extrinsic = chainApi.api.tx.parachainStaking.delegatorStakeMore(binaryAmount);

        return compoundResult(extrinsic);
      }
    }
  }

  /* Join pool action */

  /* Leave pool action */

  async handleYieldUnstake (amount: string, address: string, selectedTarget?: string): Promise<[ExtrinsicType, TransactionData]> {
    const chainApi = await this.substrateApi.isReady;
    const binaryAmount = new BN(amount);
    const poolPosition = await this.getPoolPosition(address);

    if (!selectedTarget || !poolPosition) {
      return Promise.reject(new TransactionError(BasicTxErrorType.INVALID_PARAMS));
    }

    const unstakeAll = isUnstakeAll(selectedTarget, poolPosition.nominations, amount);

    let extrinsic: SubmittableExtrinsic<'promise'>;

    if (!unstakeAll) {
      const _params = chainApi.api.tx.parachainStaking.delegatorStakeMore.toJSON() as Record<string, any>;
      const paramsCount = (_params.args as any[]).length;

      if (paramsCount === 2) {
        extrinsic = chainApi.api.tx.parachainStaking.delegatorStakeLess(selectedTarget, binaryAmount);
      } else {
        extrinsic = chainApi.api.tx.parachainStaking.delegatorStakeLess(binaryAmount);
      }
    } else {
      extrinsic = chainApi.api.tx.parachainStaking.leaveDelegators();
    }

    return [ExtrinsicType.STAKING_LEAVE_POOL, extrinsic];
  }

  /* Leave pool action */

  /* Other action */

  /**
   * @todo Need recheck
   * */
  async handleYieldCancelUnstake (params: StakeCancelWithdrawalParams): Promise<TransactionData> {
    const chainApi = await this.substrateApi.isReady;

    return chainApi.api.tx.parachainStaking.cancelLeaveCandidates();
  }

  async handleYieldWithdraw (address: string, unstakingInfo: UnstakingInfo): Promise<TransactionData> {
    const chainApi = await this.substrateApi.isReady;

    return chainApi.api.tx.parachainStaking.unlockUnstaked(address);
  }

  override async handleYieldClaimReward (address: string, bondReward?: boolean) {
    const chainApi = await this.substrateApi.isReady;

    return chainApi.api.tx.utility.batch([
      chainApi.api.tx.parachainStaking.incrementDelegatorRewards(),
      chainApi.api.tx.parachainStaking.claimRewards()
    ]);
  }

  /* Other actions */
}
