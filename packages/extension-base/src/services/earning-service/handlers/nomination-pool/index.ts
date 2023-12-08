// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { APIItemState, BasicTxErrorType, ExtrinsicType, NominationInfo, RequestYieldStepSubmit, StakeCancelWithdrawalParams, StakingTxErrorType, UnstakingInfo, YieldStepType } from '@subwallet/extension-base/background/KoniTypes';
import { calculateChainStakedReturn, calculateInflation, getExistUnstakeErrorMessage, getMinStakeErrorMessage, PalletNominationPoolsPoolMember, PalletStakingExposure, parsePoolStashAddress, transformPoolName } from '@subwallet/extension-base/koni/api/staking/bonding/utils';
import { DEFAULT_YIELD_FIRST_STEP } from '@subwallet/extension-base/koni/api/yield/helper/utils';
import KoniState from '@subwallet/extension-base/koni/background/handlers/State';
import { _STAKING_ERA_LENGTH_MAP } from '@subwallet/extension-base/services/chain-service/constants';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getChainNativeTokenSlug, _getChainSubstrateAddressPrefix } from '@subwallet/extension-base/services/chain-service/utils';
import { fakeAddress } from '@subwallet/extension-base/services/earning-service/constants';
import { EarningRewardItem, EarningStatus, HandleYieldStepData, NominationPoolInfo, NormalYieldPoolInfo, OptimalYieldPath, OptimalYieldPathParams, PalletNominationPoolsBondedPoolInner, RequestStakePoolingBonding, RuntimeDispatchInfo, SubmitJoinNativeStaking, SubmitJoinNominationPool, SubmitYieldStepData, TransactionData, UnstakingStatus, YieldPoolGroup, YieldPoolInfo, YieldPoolType, YieldPositionInfo } from '@subwallet/extension-base/types';
import { balanceFormatter, formatNumber, reformatAddress } from '@subwallet/extension-base/utils';
import { t } from 'i18next';

import { UnsubscribePromise } from '@polkadot/api-base/types/base';
import { Bytes } from '@polkadot/types';
import { Codec } from '@polkadot/types/types';
import { BN, BN_ZERO, hexToString, isHex } from '@polkadot/util';

import BasePoolHandler from '../base';

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

export default class NominationPoolHandler extends BasePoolHandler {
  protected readonly type = YieldPoolType.NOMINATION_POOL;
  protected readonly description: string;
  protected readonly group: YieldPoolGroup;
  protected readonly name: string;
  public slug: string;

  constructor (state: KoniState, chain: string) {
    super(state, chain);

    const _chainAsset = this.nativeToken;
    const _chainInfo = this.chainInfo;

    const symbol = _chainAsset.symbol;
    const tokenName = _chainAsset.name;

    const poolGroup = (): YieldPoolGroup => {
      if (symbol.includes('DOT')) {
        return YieldPoolGroup.DOT;
      } else if (symbol.includes('KSM')) {
        return YieldPoolGroup.KSM;
      } else {
        return YieldPoolGroup.OTHER;
      }
    };

    this.slug = `${symbol}___nomination_pool___${_chainInfo.slug}`;
    this.name = `${tokenName} Nomination Pool`;
    this.description = `Start staking with just {{amount}} ${symbol}`;
    this.group = poolGroup();
  }

  /* Subscribe pool info */

  async subscribePoolInfo (callback: (data: YieldPoolInfo) => void): Promise<VoidFunction> {
    let cancel = false;
    const substrateApi = this.substrateApi;
    const chainInfo = this.chainInfo;
    const nativeToken = this.nativeToken;
    const defaultData = this.defaultInfo;

    await substrateApi.isReady;

    const unsub = await (substrateApi.api.query.staking?.currentEra(async (_currentEra: Codec) => {
      if (cancel) {
        unsub();

        return;
      }

      const currentEra = _currentEra.toString();
      const maxUnlockingChunks = substrateApi.api.consts.staking.maxUnlockingChunks.toString();
      const unlockingEras = substrateApi.api.consts.staking.bondingDuration.toString();

      const [_totalEraStake, _totalIssuance, _auctionCounter, _minPoolJoin] = await Promise.all([
        substrateApi.api.query.staking.erasTotalStake(parseInt(currentEra)),
        substrateApi.api.query.balances.totalIssuance(),
        substrateApi.api.query.auctions?.auctionCounter(),
        substrateApi.api.query?.nominationPools?.minJoinBond()
      ]);

      const rawTotalEraStake = _totalEraStake.toString();
      const rawTotalIssuance = _totalIssuance.toString();

      const numAuctions = _auctionCounter ? _auctionCounter.toHuman() as number : 0;
      const bnTotalEraStake = new BN(rawTotalEraStake);
      const bnTotalIssuance = new BN(rawTotalIssuance);

      const inflation = calculateInflation(bnTotalEraStake, bnTotalIssuance, numAuctions, chainInfo.slug);
      const minPoolJoin = _minPoolJoin?.toString() || undefined;
      const expectedReturn = calculateChainStakedReturn(inflation, bnTotalEraStake, bnTotalIssuance, chainInfo.slug);
      const unlockingPeriod = parseInt(unlockingEras) * (_STAKING_ERA_LENGTH_MAP[chainInfo.slug] || _STAKING_ERA_LENGTH_MAP.default); // in hours

      if (substrateApi.api.query.nominationPools) {
        const minToHuman = formatNumber(minPoolJoin || '0', nativeToken.decimals || 0, balanceFormatter);

        const data: NormalYieldPoolInfo = {
          // TODO
          ...defaultData,
          description: this.description.replaceAll('{{amount}}', minToHuman),
          type: this.type,
          metadata: {
            isAvailable: true,
            maxCandidatePerFarmer: 1,
            maxWithdrawalRequestPerFarmer: parseInt(maxUnlockingChunks), // TODO recheck
            minJoinPool: minPoolJoin || '0',
            farmerCount: 0, // TODO recheck
            era: parseInt(currentEra),
            assetEarning: [
              {
                slug: _getChainNativeTokenSlug(chainInfo),
                apy: expectedReturn
              }
            ],
            tvl: bnTotalEraStake.toString(), // TODO recheck
            totalApy: expectedReturn, // TODO recheck
            unstakingPeriod: unlockingPeriod,
            allowCancelUnstaking: false,
            inflation: inflation,
            minWithdrawal: '0'
          }
        };

        callback(data);
      }
    }) as unknown as UnsubscribePromise);

    return () => {
      cancel = true;
      unsub();
    };
  }

  /* Subscribe pool info */

  /* Subscribe pool position */

  async getRelayChainPoolMemberMetadata (address: string, substrateApi: _SubstrateApi, poolMemberInfo: PalletNominationPoolsPoolMember): Promise<Pick<YieldPositionInfo, 'activeStake' | 'balance' | 'isBondedBefore' | 'nominations' | 'status' | 'unstakings'>> {
    const chainInfo = this.chainInfo;

    const _maxNominatorRewardedPerValidator = substrateApi.api.consts.staking.maxNominatorRewardedPerValidator.toString();
    const maxNominatorRewardedPerValidator = parseInt(_maxNominatorRewardedPerValidator);
    const poolsPalletId = substrateApi.api.consts.nominationPools.palletId.toString();
    const poolStashAccount = parsePoolStashAddress(substrateApi.api, 0, poolMemberInfo.poolId, poolsPalletId);

    const [_nominations, _poolMetadata, _currentEra] = await Promise.all([
      substrateApi.api.query.staking.nominators(poolStashAccount),
      substrateApi.api.query.nominationPools.metadata(poolMemberInfo.poolId),
      substrateApi.api.query.staking.currentEra()
    ]);

    const poolMetadata = _poolMetadata.toPrimitive() as unknown as Bytes;
    const currentEra = _currentEra.toString();
    const nominations = _nominations.toJSON() as unknown as PalletStakingNominations;

    let stakingStatus = EarningStatus.NOT_EARNING;

    // TODO: update new logic
    const poolName = transformPoolName(poolMetadata.isUtf8 ? poolMetadata.toUtf8() : poolMetadata.toString());

    if (nominations) {
      const validatorList = nominations.targets;

      await Promise.all(validatorList.map(async (validatorAddress) => {
        const _eraStaker = await substrateApi.api.query.staking.erasStakers(currentEra, validatorAddress);
        const eraStaker = _eraStaker.toPrimitive() as unknown as PalletStakingExposure;
        const topNominators = eraStaker.others.map((nominator) => {
          return nominator.who;
        }).slice(0, maxNominatorRewardedPerValidator);

        if (topNominators.includes(reformatAddress(poolStashAccount, _getChainSubstrateAddressPrefix(chainInfo)))) { // if address in top nominators
          stakingStatus = EarningStatus.EARNING_REWARD;
        }
      }));
    }

    const joinedPoolInfo: NominationInfo = {
      activeStake: poolMemberInfo.points.toString(),
      chain: chainInfo.slug,
      status: stakingStatus,
      validatorIdentity: poolName,
      validatorAddress: poolMemberInfo.poolId.toString(), // use poolId
      hasUnstaking: poolMemberInfo.unbondingEras && Object.keys(poolMemberInfo.unbondingEras).length > 0
    };

    const unstakings: UnstakingInfo[] = [];

    Object.entries(poolMemberInfo.unbondingEras).forEach(([unlockingEra, amount]) => {
      const remainingEra = parseInt(unlockingEra) - parseInt(currentEra);
      const isClaimable = remainingEra < 0;
      const waitingTime = remainingEra * _STAKING_ERA_LENGTH_MAP[chainInfo.slug];

      unstakings.push({
        chain: chainInfo.slug,
        status: isClaimable ? UnstakingStatus.CLAIMABLE : UnstakingStatus.UNLOCKING,
        claimable: amount.toString(),
        waitingTime: waitingTime
      } as UnstakingInfo);
    });

    const bnActiveStake = new BN(poolMemberInfo.points.toString());

    if (!bnActiveStake.gt(BN_ZERO)) {
      stakingStatus = EarningStatus.NOT_EARNING;
    }

    return {
      status: stakingStatus,
      balance: [{
        slug: this.nativeToken.slug,
        activeBalance: poolMemberInfo.points.toString()
      }],
      isBondedBefore: true,
      activeStake: poolMemberInfo.points.toString(),
      nominations: [joinedPoolInfo], // can only join 1 pool at a time
      unstakings
    };
  }

  async subscribePoolPosition (useAddresses: string[], resultCallback: (rs: YieldPositionInfo) => void): Promise<VoidFunction> {
    let cancel = false;
    const substrateApi = this.substrateApi;
    const nativeToken = this.nativeToken;
    const defaultInfo = this.defaultInfo;

    await substrateApi.isReady;

    const unsub = await substrateApi.api.query?.nominationPools?.poolMembers.multi(useAddresses, async (ledgers: Codec[]) => {
      if (cancel) {
        unsub();

        return;
      }

      if (ledgers) {
        await Promise.all(ledgers.map(async (_poolMemberInfo, i) => {
          const poolMemberInfo = _poolMemberInfo.toPrimitive() as unknown as PalletNominationPoolsPoolMember;
          const owner = reformatAddress(useAddresses[i], 42);

          if (poolMemberInfo) {
            const nominatorMetadata = await this.getRelayChainPoolMemberMetadata(owner, substrateApi, poolMemberInfo);

            resultCallback({
              ...defaultInfo,
              ...nominatorMetadata,
              address: owner,
              type: this.type
            });
          } else {
            resultCallback({
              ...defaultInfo,
              type: YieldPoolType.NOMINATION_POOL,
              address: owner,
              balance: [
                {
                  slug: nativeToken.slug,
                  activeBalance: '0'
                }
              ],
              status: EarningStatus.NOT_STAKING,
              activeStake: '0',
              nominations: [], // can only join 1 pool at a time
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

  /* Get pool reward */

  async getPoolReward (useAddresses: string[], callBack: (rs: EarningRewardItem) => void): Promise<VoidFunction> {
    let cancel = false;
    const substrateApi = this.substrateApi;

    await substrateApi.isReady;

    if (substrateApi.api.call.nominationPoolsApi) {
      for (const address of useAddresses) {
        if (!cancel) {
          const _unclaimedReward = await substrateApi.api.call?.nominationPoolsApi?.pendingRewards(address);

          if (_unclaimedReward) {
            callBack({
              ...this.defaultInfo,
              address: address,
              type: this.type,
              unclaimedReward: _unclaimedReward.toString(),
              state: APIItemState.READY
            });
          }
        }
      }
    }

    return () => {
      cancel = false;
    };
  }

  /* Get pool reward */

  /* Get pool targets */

  async getPoolTargets (): Promise<NominationPoolInfo[]> {
    const substrateApi = await this.substrateApi.isReady;

    const nominationPools: NominationPoolInfo[] = [];

    const _allPoolsInfo = await substrateApi.api.query.nominationPools.reversePoolIdLookup.entries();

    await Promise.all(_allPoolsInfo.map(async (_poolInfo) => {
      const poolAddressList = _poolInfo[0].toHuman() as string[];
      const poolAddress = poolAddressList[0];
      const poolId = _poolInfo[1].toPrimitive() as number;
      const poolsPalletId = substrateApi.api.consts.nominationPools.palletId.toString();
      const poolStashAccount = parsePoolStashAddress(substrateApi.api, 0, poolId, poolsPalletId);

      const [_nominations, _bondedPool, _metadata, _minimumActiveStake] = await Promise.all([
        substrateApi.api.query.staking.nominators(poolStashAccount),
        substrateApi.api.query.nominationPools.bondedPools(poolId),
        substrateApi.api.query.nominationPools.metadata(poolId),
        substrateApi.api.query.staking.minimumActiveStake()
      ]);

      const minimumActiveStake = _minimumActiveStake.toPrimitive() as number;
      const nominations = _nominations.toJSON() as unknown as PalletStakingNominations;

      const poolMetadata = _metadata.toPrimitive() as unknown as string;
      const bondedPool = _bondedPool.toPrimitive() as unknown as PalletNominationPoolsBondedPoolInner;

      // const poolName = transformPoolName(poolMetadata.isUtf8 ? poolMetadata.toUtf8() : poolMetadata.toString());

      const poolName = isHex(poolMetadata) ? hexToString(poolMetadata) : poolMetadata;

      const isPoolOpen = bondedPool.state === 'Open';
      const isPoolNominating = !!nominations && nominations.targets.length > 0;
      const isPoolEarningReward = bondedPool.points > minimumActiveStake;

      nominationPools.push({
        id: poolId,
        address: poolAddress,
        name: poolName,
        bondedAmount: bondedPool.points?.toString() || '0',
        roles: bondedPool.roles,
        memberCounter: bondedPool.memberCounter,
        state: bondedPool.state,
        isProfitable: isPoolOpen && isPoolNominating && isPoolEarningReward
      });
    }));

    return nominationPools;
  }

  /* Get pool targets */

  /* Join pool action */

  async generateOptimalPath (params: OptimalYieldPathParams): Promise<OptimalYieldPath> {
    const result: OptimalYieldPath = {
      totalFee: [],
      steps: [DEFAULT_YIELD_FIRST_STEP]
    };

    const feeAsset = this.nativeToken.slug;
    const substrateApi = await this.substrateApi.isReady;

    result.steps.push({
      id: result.steps.length,
      metadata: {
        amount: params.amount
      },
      name: 'Join nomination pool',
      type: YieldStepType.JOIN_NOMINATION_POOL
    });

    // TODO: check existing position
    const _joinPoolFeeInfo = await substrateApi.api.tx.nominationPools.join(params.amount, 1).paymentInfo(fakeAddress);
    const joinPoolFeeInfo = _joinPoolFeeInfo.toPrimitive() as unknown as RuntimeDispatchInfo;

    result.totalFee.push({
      slug: feeAsset,
      amount: joinPoolFeeInfo.partialFee.toString()
    });

    return result;
  }

  async validateYieldJoin (address: string, params: OptimalYieldPathParams, path: OptimalYieldPath, data?: SubmitYieldStepData | SubmitJoinNativeStaking | SubmitJoinNominationPool): Promise<TransactionError[]> {
    if (!data) {
      return Promise.resolve([new TransactionError(BasicTxErrorType.INTERNAL_ERROR)]);
    }

    const _poolInfo = await this.getPoolInfo();

    if (!_poolInfo) {
      return Promise.resolve([new TransactionError(BasicTxErrorType.INTERNAL_ERROR)]);
    }

    const poolInfo = _poolInfo as NormalYieldPoolInfo;
    const chainInfo = this.chainInfo;
    const inputData = data as SubmitJoinNominationPool;
    const { amount, selectedPool } = inputData;

    const positionInfo = await this.getPoolPosition(address);

    // cannot stake when unstake all
    // amount >= min stake
    const errors: TransactionError[] = [];
    let bnTotalStake = new BN(amount);
    const bnMinStake = new BN(poolInfo.metadata.minJoinPool || '0');
    const minStakeErrorMessage = getMinStakeErrorMessage(chainInfo, bnMinStake);
    const existUnstakeErrorMessage = getExistUnstakeErrorMessage(chainInfo.slug, true);

    if (selectedPool.state !== 'Open') {
      errors.push(new TransactionError(StakingTxErrorType.INACTIVE_NOMINATION_POOL));
    }

    if (positionInfo) {
      const bnCurrentActiveStake = new BN(positionInfo.activeStake);

      bnTotalStake = bnTotalStake.add(bnCurrentActiveStake);

      if (positionInfo.unstakings.length > 0 && bnCurrentActiveStake.isZero()) {
        errors.push(new TransactionError(StakingTxErrorType.EXIST_UNSTAKING_REQUEST, existUnstakeErrorMessage));
      }
    }

    if (!bnTotalStake.gte(bnMinStake)) {
      errors.push(new TransactionError(StakingTxErrorType.NOT_ENOUGH_MIN_STAKE, minStakeErrorMessage));
    }

    return errors;
  }

  async createJoinExtrinsic (data: SubmitJoinNominationPool, positionInfo?: YieldPositionInfo): Promise<TransactionData> {
    const { amount, selectedPool: { id: selectedPoolId } } = data;

    const chainApi = await this.substrateApi.isReady;
    const bnActiveStake = new BN(positionInfo?.activeStake || '0');

    if (bnActiveStake.gt(BN_ZERO)) { // already joined a pool
      return chainApi.api.tx.nominationPools.bondExtra({ FreeBalance: amount });
    }

    return chainApi.api.tx.nominationPools.join(amount, selectedPoolId);
  }

  async handleYieldJoin (address: string, params: OptimalYieldPathParams, requestData: RequestYieldStepSubmit, path: OptimalYieldPath, currentStep: number): Promise<HandleYieldStepData> {
    const data = requestData.data as SubmitJoinNominationPool;
    const positionInfo = await this.getPoolPosition(address);
    const extrinsic = await this.createJoinExtrinsic(data);

    const joinPoolData: RequestStakePoolingBonding = {
      poolPosition: positionInfo,
      chain: this.chain,
      selectedPool: data.selectedPool,
      amount: data.amount,
      address
    };

    return {
      txChain: this.chain,
      extrinsicType: ExtrinsicType.STAKING_JOIN_POOL,
      extrinsic,
      txData: joinPoolData,
      transferNativeAmount: data.amount
    };
  }

  /* Join pool action */

  /* Leave pool action */

  async validateYieldLeave (amount: string, address: string, selectedTarget?: string): Promise<TransactionError[]> {
    const errors: TransactionError[] = [];

    const poolInfo = await this.getPoolInfo();
    const poolPosition = await this.getPoolPosition(address);

    if (!poolInfo || !poolPosition) {
      return [new TransactionError(BasicTxErrorType.INTERNAL_ERROR)];
    }

    const bnActiveStake = new BN(poolPosition.activeStake);
    const bnRemainingStake = bnActiveStake.sub(new BN(amount));
    const minStake = new BN(poolInfo.metadata.minJoinPool || '0');
    const maxUnstake = poolInfo.metadata.maxWithdrawalRequestPerFarmer;

    if (!(bnRemainingStake.isZero() || bnRemainingStake.gte(minStake))) {
      errors.push(new TransactionError(StakingTxErrorType.INVALID_ACTIVE_STAKE));
    }

    if (poolPosition.unstakings.length > maxUnstake) {
      errors.push(new TransactionError(StakingTxErrorType.EXCEED_MAX_UNSTAKING, t('You cannot unstake more than {{number}} times', { replace: { number: maxUnstake } })));
    }

    return Promise.resolve(errors);
  }

  async handleYieldLeave (amount: string, address: string, selectedTarget?: string): Promise<[ExtrinsicType, TransactionData]> {
    const chainApi = await this.substrateApi.isReady;
    const poolPosition = await this.getPoolPosition(address);

    if (!poolPosition) {
      return Promise.reject(new TransactionError(BasicTxErrorType.INTERNAL_ERROR));
    }

    const extrinsic = chainApi.api.tx.nominationPools.unbond({ Id: poolPosition.address }, amount);

    return [ExtrinsicType.STAKING_LEAVE_POOL, extrinsic];
  }

  /* Leave pool action */

  /* Other action */

  handleYieldCancelUnstake (params: StakeCancelWithdrawalParams): Promise<TransactionData> {
    return Promise.reject(new TransactionError(BasicTxErrorType.UNSUPPORTED));
  }

  async handleYieldClaimReward (address: string, bondReward?: boolean): Promise<TransactionData> {
    const chainApi = await this.substrateApi.isReady;

    if (bondReward) {
      return chainApi.api.tx.nominationPools.bondExtra('Rewards');
    }

    return chainApi.api.tx.nominationPools.claimPayout();
  }

  async handleYieldWithdraw (address: string, selectedTarget?: string): Promise<TransactionData> {
    const chainApi = await this.substrateApi.isReady;

    if (chainApi.api.tx.nominationPools.withdrawUnbonded.meta.args.length === 2) {
      const _slashingSpans = (await chainApi.api.query.staking.slashingSpans(address)).toHuman() as Record<string, any>;
      const slashingSpanCount = _slashingSpans !== null ? _slashingSpans.spanIndex as string : '0';

      return chainApi.api.tx.nominationPools.withdrawUnbonded({ Id: address }, slashingSpanCount);
    } else {
      return chainApi.api.tx.nominationPools.withdrawUnbonded({ Id: address });
    }
  }

  /* Other actions */
}
