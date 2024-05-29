// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { BasicTxErrorType, ExtrinsicType, NominationInfo, StakingTxErrorType, UnstakingInfo } from '@subwallet/extension-base/background/KoniTypes';
import { calculateAlephZeroValidatorReturn, calculateChainStakedReturnV2, calculateInflation, calculateTernoaValidatorReturn, calculateValidatorStakedReturn, getAvgValidatorEraReward, getCommission, getMaxValidatorErrorMessage, getMinStakeErrorMessage, getRelayBlockedValidatorList, getRelayEraRewardMap, getRelayMaxNominations, getRelayTopValidatorByPoints, getRelayValidatorPointsMap, getSupportedDaysByHistoryDepth } from '@subwallet/extension-base/koni/api/staking/bonding/utils';
import { _STAKING_ERA_LENGTH_MAP } from '@subwallet/extension-base/services/chain-service/constants';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getChainSubstrateAddressPrefix } from '@subwallet/extension-base/services/chain-service/utils';
import { _STAKING_CHAIN_GROUP, _UPDATED_RUNTIME_STAKING_GROUP, MaxEraRewardPointsEras } from '@subwallet/extension-base/services/earning-service/constants';
import { applyDecimal, parseIdentity } from '@subwallet/extension-base/services/earning-service/utils';
import { BaseYieldPositionInfo, EarningStatus, NativeYieldPoolInfo, OptimalYieldPath, PalletStakingActiveEraInfo, PalletStakingExposure, PalletStakingExposureItem, PalletStakingNominations, PalletStakingStakingLedger, SpStakingExposurePage, SpStakingPagedExposureMetadata, StakeCancelWithdrawalParams, SubmitJoinNativeStaking, SubmitYieldJoinData, TernoaStakingRewardsStakingRewardsData, TransactionData, UnstakingStatus, ValidatorExtraInfo, ValidatorInfo, YieldPoolInfo, YieldPositionInfo, YieldTokenBaseInfo } from '@subwallet/extension-base/types';
import { balanceFormatter, formatNumber, reformatAddress } from '@subwallet/extension-base/utils';
import BigN from 'bignumber.js';
import { t } from 'i18next';

import { SubmittableExtrinsic } from '@polkadot/api/types';
import { UnsubscribePromise } from '@polkadot/api-base/types/base';
import { DeriveSessionProgress } from '@polkadot/api-derive/types';
import { Codec } from '@polkadot/types/types';
import { BN, BN_ZERO } from '@polkadot/util';

import BaseNativeStakingPoolHandler from './base';

export default class RelayNativeStakingPoolHandler extends BaseNativeStakingPoolHandler {
  /* Subscribe pool info */

  async subscribePoolInfo (callback: (data: YieldPoolInfo) => void): Promise<VoidFunction> {
    let cancel = false;
    const substrateApi = this.substrateApi;
    const chainInfo = this.chainInfo;
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

    await substrateApi.isReady;

    const unsub = await (substrateApi.api.query.staking?.currentEra(async (_currentEra: Codec) => {
      if (cancel) {
        unsub();

        return;
      }

      const unlimitedNominatorRewarded = substrateApi.api.consts.staking.maxExposurePageSize !== undefined;
      const maxNominatorRewarded = substrateApi.api.consts.staking.maxNominatorRewardedPerValidator?.toString();
      const maxNominations = await getRelayMaxNominations(substrateApi);
      const currentEra = _currentEra.toString();
      const maxUnlockingChunks = substrateApi.api.consts.staking.maxUnlockingChunks.toString();
      const unlockingEras = substrateApi.api.consts.staking.bondingDuration.toString();

      const maxSupportedEras = substrateApi.api.consts.staking.historyDepth.toString(); // todo: handle case historyDepth undefined
      const erasPerDay = 24 / _STAKING_ERA_LENGTH_MAP[chainInfo.slug] || _STAKING_ERA_LENGTH_MAP.default; // Can be exactly calculate from babe.epochDuration * blockTime * staking.sessionsPerEra

      const supportedDays = getSupportedDaysByHistoryDepth(erasPerDay, parseInt(maxSupportedEras), parseInt(currentEra) / erasPerDay);

      const startEra = parseInt(currentEra) - supportedDays * erasPerDay;

      const [_EraStakeInfo, _totalIssuance, _auctionCounter, _minNominatorBond, _counterForNominators, _minimumActiveStake, ..._eraReward] = await Promise.all([
        substrateApi.api.query.staking.erasTotalStake.multi([parseInt(currentEra), parseInt(currentEra) - 1]),
        substrateApi.api.query.balances.totalIssuance(),
        substrateApi.api.query.auctions?.auctionCounter(),
        substrateApi.api.query.staking.minNominatorBond(),
        substrateApi.api.query.staking.counterForNominators(),
        substrateApi.api.query?.staking?.minimumActiveStake && substrateApi.api.query?.staking?.minimumActiveStake(),
        substrateApi.api.query.staking.erasValidatorReward.multi([...Array(supportedDays).keys()].map((i) => i + startEra))
      ]);
      const [_totalEraStake, _lastTotalStaked] = _EraStakeInfo;
      const validatorEraReward = getAvgValidatorEraReward(supportedDays, _eraReward[0]);
      const lastTotalStaked = _lastTotalStaked.toString();

      const minActiveStake = _minimumActiveStake?.toString() || '0';
      const minNominatorBond = _minNominatorBond.toString();

      const bnMinActiveStake = new BN(minActiveStake);
      const bnMinNominatorBond = new BN(minNominatorBond);

      const minStake = bnMinActiveStake.gt(bnMinNominatorBond) ? bnMinActiveStake : bnMinNominatorBond;
      const rawTotalEraStake = _totalEraStake.toString();
      const rawTotalIssuance = _totalIssuance.toString();

      const numAuctions = _auctionCounter ? _auctionCounter.toHuman() as number : 0;
      const bnTotalEraStake = new BN(rawTotalEraStake);
      const bnTotalIssuance = new BN(rawTotalIssuance);

      const inflation = calculateInflation(bnTotalEraStake, bnTotalIssuance, numAuctions, chainInfo.slug);
      const expectedReturn = calculateChainStakedReturnV2(chainInfo, rawTotalIssuance, erasPerDay, lastTotalStaked, validatorEraReward, true);
      const eraTime = _STAKING_ERA_LENGTH_MAP[chainInfo.slug] || _STAKING_ERA_LENGTH_MAP.default; // in hours
      const unlockingPeriod = parseInt(unlockingEras) * eraTime; // in hours
      const farmerCount = _counterForNominators.toPrimitive() as number;

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
              slug: this.nativeToken.slug,
              apy: expectedReturn
            }
          ],
          maxCandidatePerFarmer: parseInt(maxNominations),
          maxWithdrawalRequestPerFarmer: parseInt(maxUnlockingChunks), // TODO recheck
          earningThreshold: {
            join: minStake.toString(),
            defaultUnstake: '0',
            fastUnstake: '0'
          },
          farmerCount: farmerCount,
          era: parseInt(currentEra),
          eraTime,
          tvl: bnTotalEraStake.toString(), // TODO recheck
          totalApy: expectedReturn, // TODO recheck
          unstakingPeriod: unlockingPeriod,
          inflation: inflation
        },
        maxPoolMembers: unlimitedNominatorRewarded ? undefined : maxNominatorRewarded ? parseInt(maxNominatorRewarded) : undefined
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

  async parseNominatorMetadata (chainInfo: _ChainInfo, address: string, substrateApi: _SubstrateApi, ledger: PalletStakingStakingLedger, currentEra: string, minStake: BN, _deriveSessionProgress: DeriveSessionProgress): Promise<Omit<YieldPositionInfo, keyof BaseYieldPositionInfo>> {
    const chain = chainInfo.slug;

    const [_nominations, _bonded, _activeEra] = await Promise.all([
      substrateApi.api.query?.staking?.nominators(address),
      substrateApi.api.query?.staking?.bonded(address),
      substrateApi.api.query?.staking?.activeEra()
    ]);
    const unlimitedNominatorRewarded = substrateApi.api.consts.staking.maxExposurePageSize !== undefined;
    const _maxNominatorRewardedPerValidator = (substrateApi.api.consts.staking.maxNominatorRewardedPerValidator || 0).toString();
    const maxNominatorRewardedPerValidator = unlimitedNominatorRewarded ? undefined : parseInt(_maxNominatorRewardedPerValidator);
    const nominations = _nominations.toPrimitive() as unknown as PalletStakingNominations;
    const bonded = _bonded.toHuman();
    const addressFormatted = reformatAddress(address, _getChainSubstrateAddressPrefix(chainInfo));

    const activeStake = ledger.active.toString();
    const totalStake = ledger.total.toString();
    const unstakingBalance = (ledger.total - ledger.active).toString();
    const unstakingList: UnstakingInfo[] = [];
    const nominationList = await this.handleNominationsList(substrateApi, chain, nominations, currentEra, addressFormatted, maxNominatorRewardedPerValidator) || [];

    let stakingStatus = EarningStatus.NOT_EARNING;
    const bnActiveStake = new BN(activeStake);
    let waitingNominationCount = 0;

    if (bnActiveStake.gte(minStake) && bnActiveStake.gt(BN_ZERO)) {
      for (const nomination of nominationList) {
        if (nomination.status === EarningStatus.EARNING_REWARD) { // only need 1 earning nomination to count
          stakingStatus = EarningStatus.EARNING_REWARD;
        } else if (nomination.status === EarningStatus.WAITING) {
          waitingNominationCount += 1;
        }
      }

      if (waitingNominationCount === nominationList.length) {
        stakingStatus = EarningStatus.WAITING;
      }
    }

    ledger.unlocking.forEach((unlockingChunk) => {
      const activeEra = _activeEra.toPrimitive() as unknown as PalletStakingActiveEraInfo;
      const era = parseInt(activeEra.index);
      const startTimestampMs = parseInt(activeEra.start);

      const remainingEra = unlockingChunk.era - era;
      const eraTime = _STAKING_ERA_LENGTH_MAP[chainInfo.slug] || _STAKING_ERA_LENGTH_MAP.default; // in hours
      const remaningTimestampMs = remainingEra * eraTime * 60 * 60 * 1000;
      const targetTimestampMs = startTimestampMs + remaningTimestampMs;
      const isClaimable = targetTimestampMs - Date.now() <= 0;

      unstakingList.push({
        chain,
        status: isClaimable ? UnstakingStatus.CLAIMABLE : UnstakingStatus.UNLOCKING,
        claimable: unlockingChunk.value.toString(),
        targetTimestampMs: targetTimestampMs
      } as UnstakingInfo);
    });

    return {
      status: stakingStatus,
      balanceToken: this.nativeToken.slug,
      totalStake: totalStake,
      activeStake: activeStake,
      unstakeBalance: unstakingBalance,
      isBondedBefore: bonded !== null,
      nominations: nominationList,
      unstakings: unstakingList
    };
  }

  async handleNominationsList (substrateApi: _SubstrateApi, chain: string, nominations: PalletStakingNominations, currentEra: string, address: string, maxNominatorRewardedPerValidator: number | undefined) {
    const nominationList: NominationInfo[] = [];

    if (!nominations) {
      return [];
    }

    const validatorList = nominations.targets;

    await Promise.all(validatorList.map(async (validatorAddress) => {
      let nominationStatus = EarningStatus.NOT_EARNING;
      let eraStakerOtherList: PalletStakingExposureItem[] = [];
      let identity;

      if (_UPDATED_RUNTIME_STAKING_GROUP.includes(this.chain)) { // todo: review all relaychains later
        const [[_identity], _eraStaker] = await Promise.all([
          parseIdentity(substrateApi, validatorAddress),
          substrateApi.api.query.staking.erasStakersPaged.entries(currentEra, validatorAddress)
        ]);

        identity = _identity;
        eraStakerOtherList = _eraStaker.flatMap((paged) => (paged[1].toPrimitive() as unknown as SpStakingExposurePage).others);
      } else {
        const [[_identity], _eraStaker] = await Promise.all([
          parseIdentity(substrateApi, validatorAddress),
          substrateApi.api.query.staking.erasStakers(currentEra, validatorAddress)
        ]);

        identity = _identity;
        const eraStaker = _eraStaker.toPrimitive() as unknown as PalletStakingExposure;

        eraStakerOtherList = eraStaker.others;
      }

      const sortedNominators = eraStakerOtherList
        .sort((a, b) => {
          return new BigN(b.value).minus(a.value).toNumber();
        })
      ;
      const topNominators = sortedNominators
        .map((nominator) => {
          return nominator.who;
        })
      ;

      if (!topNominators.includes(address)) { // if nominator has target but not in nominator list
        nominationStatus = EarningStatus.WAITING;
      } else if (topNominators.slice(0, maxNominatorRewardedPerValidator).includes(address)) { // if address in top nominators
        nominationStatus = EarningStatus.EARNING_REWARD;
      }

      nominationList.push({
        chain,
        validatorAddress,
        status: nominationStatus,
        validatorIdentity: identity,
        activeStake: '0' // relaychain allocates stake accordingly
      } as NominationInfo);
    }));

    return nominationList;
  }

  async subscribePoolPosition (useAddresses: string[], resultCallback: (rs: YieldPositionInfo) => void): Promise<VoidFunction> {
    let cancel = false;
    const substrateApi = await this.substrateApi.isReady;
    const defaultInfo = this.baseInfo;
    const chainInfo = this.chainInfo;

    const unsub = await substrateApi.api.query.staking?.ledger.multi(useAddresses, async (ledgers: Codec[]) => {
      if (cancel) {
        unsub();

        return;
      }

      if (ledgers) {
        const [_currentEra, _minimumActiveStake, _minNominatorBond, _deriveSessionProgress] = await Promise.all([
          substrateApi.api.query?.staking?.currentEra(),
          substrateApi.api.query?.staking?.minimumActiveStake && substrateApi.api.query?.staking?.minimumActiveStake(),
          substrateApi.api.query?.staking?.minNominatorBond(),
          substrateApi.api.derive?.session?.progress()
        ]);

        const currentEra = _currentEra.toString();
        const minActiveStake = _minimumActiveStake?.toString() || '0';
        const minNominatorBond = _minNominatorBond.toString();
        const bnMinActiveStake = new BN(minActiveStake);
        const bnMinNominatorBond = new BN(minNominatorBond);
        const minStake = bnMinActiveStake.gt(bnMinNominatorBond) ? bnMinActiveStake : bnMinNominatorBond;

        await Promise.all(ledgers.map(async (_ledger: Codec, i) => {
          const owner = reformatAddress(useAddresses[i], 42);
          const ledger = _ledger.toPrimitive() as unknown as PalletStakingStakingLedger;

          if (ledger) {
            const nominatorMetadata = await this.parseNominatorMetadata(chainInfo, owner, substrateApi, ledger, currentEra, minStake, _deriveSessionProgress);

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
              balanceToken: this.nativeToken.slug,
              address: owner,
              totalStake: '0',
              activeStake: '0',
              unstakeBalance: '0',
              isBondedBefore: false,
              status: EarningStatus.NOT_STAKING,
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
    const chainApi = await this.substrateApi.isReady;
    const poolInfo = await this.getPoolInfo();

    if (!poolInfo || !poolInfo.statistic) {
      return Promise.reject(new TransactionError(BasicTxErrorType.INTERNAL_ERROR));
    }

    const [_era, _activeEraInfo] = await Promise.all([
      chainApi.api.query.staking.currentEra(),
      chainApi.api.query.staking.activeEra()
    ]);

    const currentEra = _era.toString();
    const activeEraInfo = _activeEraInfo.toPrimitive() as unknown as PalletStakingActiveEraInfo;
    const activeEra = activeEraInfo.index;

    const maxEraRewardPointsEras = MaxEraRewardPointsEras;
    const endEraForPoints = parseInt(activeEra) - 1;
    const startEraForPoints = Math.max(endEraForPoints - maxEraRewardPointsEras + 1, 0);

    let _eraStakersPromise;

    if (_UPDATED_RUNTIME_STAKING_GROUP.includes(this.chain)) { // todo: review all relaychains later
      _eraStakersPromise = chainApi.api.query.staking.erasStakersOverview.entries(parseInt(currentEra));
    } else {
      _eraStakersPromise = chainApi.api.query.staking.erasStakers.entries(parseInt(currentEra));
    }

    const [_totalEraStake, _eraStakers, _minBond, _stakingRewards, _validators, ..._eraRewardPoints] = await Promise.all([
      chainApi.api.query.staking.erasTotalStake(parseInt(currentEra)),
      _eraStakersPromise,
      chainApi.api.query.staking.minNominatorBond(),
      chainApi.api.query.stakingRewards?.data && chainApi.api.query.stakingRewards.data(),
      chainApi.api.query.staking.validators.entries(),
      chainApi.api.query.staking.erasRewardPoints.multi([...Array(maxEraRewardPointsEras).keys()].map((i) => i + startEraForPoints))
    ]);

    const eraRewardMap = getRelayEraRewardMap(_eraRewardPoints[0], startEraForPoints);
    const validatorPointsMap = getRelayValidatorPointsMap(eraRewardMap);
    const topValidatorList = getRelayTopValidatorByPoints(validatorPointsMap);

    const validators = _validators as any[];
    const blockedValidatorList = getRelayBlockedValidatorList(validators);

    const unlimitedNominatorRewarded = chainApi.api.consts.staking.maxExposurePageSize !== undefined;
    const maxNominatorRewarded = (chainApi.api.consts.staking.maxNominatorRewardedPerValidator || 0).toString();
    const bnTotalEraStake = new BN(_totalEraStake.toString());

    const minBond = _minBond.toPrimitive() as number;

    const [totalStakeMap, allValidatorAddresses, validatorInfoList] = this.parseEraStakerData(_eraStakers, blockedValidatorList, topValidatorList, validatorPointsMap, minBond, maxNominatorRewarded, unlimitedNominatorRewarded);

    const extraInfoMap: Record<string, ValidatorExtraInfo> = {};

    await Promise.all(allValidatorAddresses.map(async (address) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const [_commissionInfo, [identity, isVerified]] = await Promise.all([
        chainApi.api.query.staking.validators(address),
        parseIdentity(chainApi, address)
      ]);

      const commissionInfo = _commissionInfo.toHuman() as Record<string, any>;

      extraInfoMap[address] = {
        commission: commissionInfo.commission as string,
        blocked: commissionInfo.blocked as boolean,
        identity,
        isVerified: isVerified
      } as ValidatorExtraInfo;
    }));

    const decimals = this.nativeToken.decimals || 0;
    const bnAvgStake = applyDecimal(bnTotalEraStake.divn(validatorInfoList.length), decimals);

    for (const validator of validatorInfoList) {
      const commissionString = extraInfoMap[validator.address].commission;
      const commission = getCommission(commissionString);

      validator.expectedReturn = this.getValidatorExpectedReturn(this.chain, validator, poolInfo.statistic.totalApy as number, commission, _stakingRewards, allValidatorAddresses, decimals, totalStakeMap, bnAvgStake);
      validator.commission = commission;
      validator.blocked = extraInfoMap[validator.address].blocked;
      validator.identity = extraInfoMap[validator.address].identity;
      validator.isVerified = extraInfoMap[validator.address].isVerified;
    }

    return validatorInfoList;
  }

  private getValidatorExpectedReturn (chain: string, validator: ValidatorInfo, totalApy: number, commission: number, _stakingRewards: Codec, allValidatorAddresses: string[], decimals: number, totalStakeMap: Record<string, BN>, bnAvgStake: BN) {
    if (_STAKING_CHAIN_GROUP.aleph.includes(chain)) {
      return calculateAlephZeroValidatorReturn(totalApy, commission);
    } else if (_STAKING_CHAIN_GROUP.ternoa.includes(chain)) {
      const stakingRewards = _stakingRewards?.toPrimitive() as unknown as TernoaStakingRewardsStakingRewardsData;
      const rewardPerValidator = applyDecimal(new BN(stakingRewards.sessionExtraRewardPayout).divn(allValidatorAddresses.length), decimals);
      const validatorStake = applyDecimal(totalStakeMap[validator.address], decimals).toNumber();

      return calculateTernoaValidatorReturn(rewardPerValidator.toNumber(), validatorStake, commission);
    } else {
      const bnValidatorStake = applyDecimal(totalStakeMap[validator.address], decimals);

      return calculateValidatorStakedReturn(totalApy, bnValidatorStake, bnAvgStake, commission);
    }
  }

  private parseEraStakerData (_eraStakers: any[], blockedValidatorList: string[], topValidatorList: string[], validatorPointsMap: Record<string, BigN>, minBond: number, maxNominatorRewarded: string, unlimitedNominatorRewarded: boolean): [Record<string, BN>, string[], ValidatorInfo[]] {
    const totalStakeMap: Record<string, BN> = {};
    const allValidatorAddresses: string[] = [];
    const validatorInfoList: ValidatorInfo[] = [];

    for (const item of _eraStakers) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      const rawValidatorInfo = item[0].toHuman() as any[];
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      const rawValidatorStat = item[1].toPrimitive() as SpStakingPagedExposureMetadata;
      const validatorAddress = rawValidatorInfo[1] as string;

      if (!blockedValidatorList.includes(validatorAddress)) {
        let isTopQuartile = false;

        if (topValidatorList.includes(validatorAddress)) {
          isTopQuartile = true;
        }

        const bnTotalStake = new BN(rawValidatorStat.total);
        const bnOwnStake = new BN(rawValidatorStat.own);
        const otherStake = bnTotalStake.sub(bnOwnStake);

        totalStakeMap[validatorAddress] = bnTotalStake;

        let nominatorCount = 0;

        if (_UPDATED_RUNTIME_STAKING_GROUP.includes(this.chain)) {
          nominatorCount = rawValidatorStat.nominatorCount;
        } else {
          if ('others' in rawValidatorStat) { // todo: handle interfaces and types better
            // @ts-ignore
            const others = rawValidatorStat.others as Record<string, any>[];

            nominatorCount = others.length;
          }
        }

        allValidatorAddresses.push(validatorAddress);

        validatorInfoList.push({
          address: validatorAddress,
          totalStake: bnTotalStake.toString(),
          ownStake: bnOwnStake.toString(),
          otherStake: otherStake.toString(),
          nominatorCount,
          // to be added later
          commission: 0,
          expectedReturn: 0,
          blocked: false,
          isVerified: false,
          minBond: minBond.toString(),
          isCrowded: unlimitedNominatorRewarded ? false : nominatorCount > parseInt(maxNominatorRewarded),
          eraRewardPoint: (validatorPointsMap[validatorAddress] ?? BN_ZERO).toString(),
          topQuartile: isTopQuartile
        } as ValidatorInfo);
      }
    }

    return [totalStakeMap, allValidatorAddresses, validatorInfoList];
  }
  /* Get pool targets */

  /* Join pool action */

  async validateYieldJoin (data: SubmitYieldJoinData, path: OptimalYieldPath): Promise<TransactionError[]> {
    const { address, amount, selectedValidators } = data as SubmitJoinNativeStaking;
    const _poolInfo = await this.getPoolInfo();
    const poolPosition = await this.getPoolPosition(address);
    const chainInfo = this.chainInfo;
    const bnAmount = new BN(amount);

    if (bnAmount.lte(BN_ZERO)) {
      return Promise.resolve([new TransactionError(BasicTxErrorType.INVALID_PARAMS, 'Amount must be greater than 0')]);
    }

    if (!_poolInfo) {
      return Promise.resolve([new TransactionError(BasicTxErrorType.INTERNAL_ERROR)]);
    }

    const poolInfo = _poolInfo as NativeYieldPoolInfo;

    if (!poolInfo.statistic) {
      return Promise.resolve([new TransactionError(BasicTxErrorType.INTERNAL_ERROR)]);
    }

    const errors: TransactionError[] = [];
    let bnTotalStake = new BN(amount);
    const bnMinStake = new BN(poolInfo.statistic.earningThreshold.join);
    const minStakeErrorMessage = getMinStakeErrorMessage(chainInfo, bnMinStake);
    const maxValidatorErrorMessage = getMaxValidatorErrorMessage(chainInfo, poolInfo.statistic.maxCandidatePerFarmer);

    if (!poolPosition || poolPosition.status === EarningStatus.NOT_STAKING) {
      if (!bnTotalStake.gte(bnMinStake)) {
        errors.push(new TransactionError(StakingTxErrorType.NOT_ENOUGH_MIN_STAKE, minStakeErrorMessage));
      }

      if (selectedValidators.length > poolInfo.statistic.maxCandidatePerFarmer) {
        errors.push(new TransactionError(StakingTxErrorType.EXCEED_MAX_NOMINATIONS, maxValidatorErrorMessage));
      }

      return errors;
    }

    const bnCurrentActiveStake = new BN(poolPosition.activeStake);

    bnTotalStake = bnTotalStake.add(bnCurrentActiveStake);

    if (!bnTotalStake.gte(bnMinStake)) {
      errors.push(new TransactionError(StakingTxErrorType.NOT_ENOUGH_MIN_STAKE, minStakeErrorMessage));
    }

    if (selectedValidators.length > poolInfo.statistic.maxCandidatePerFarmer) {
      errors.push(new TransactionError(StakingTxErrorType.EXCEED_MAX_NOMINATIONS, maxValidatorErrorMessage));
    }

    return errors;
  }

  async createJoinExtrinsic (data: SubmitJoinNativeStaking, positionInfo?: YieldPositionInfo, bondDest = 'Staked'): Promise<[TransactionData, YieldTokenBaseInfo]> {
    const { address, amount, selectedValidators: targetValidators } = data;
    const chainApi = await this.substrateApi.isReady;
    const binaryAmount = new BN(amount);
    const tokenSlug = this.nativeToken.slug;

    let bondTx: SubmittableExtrinsic<'promise'> | undefined;
    let nominateTx: SubmittableExtrinsic<'promise'> | undefined;

    const _params = chainApi.api.tx.staking.bond.toJSON() as Record<string, any>;
    const paramsCount = (_params.args as any[]).length;

    const validatorParamList = targetValidators.map((validator) => {
      return validator.address;
    });

    // eslint-disable-next-line @typescript-eslint/require-await
    const compoundTransactions = async (bondTx: SubmittableExtrinsic<'promise'>, nominateTx: SubmittableExtrinsic<'promise'>): Promise<[TransactionData, YieldTokenBaseInfo]> => {
      const extrinsic = chainApi.api.tx.utility.batchAll([bondTx, nominateTx]);
      // const fees = await Promise.all([bondTx.paymentInfo(address), nominateTx.paymentInfo(address)]);
      // const totalFee = fees.reduce((previousValue, currentItem) => {
      //   const fee = currentItem.toPrimitive() as unknown as RuntimeDispatchInfo;
      //
      //   return previousValue + fee.partialFee;
      // }, 0);

      // Not use the fee to validate and to display on UI
      return [extrinsic, { slug: tokenSlug, amount: '0' }];
    };

    if (!positionInfo) {
      if (paramsCount === 2) {
        bondTx = chainApi.api.tx.staking.bond(binaryAmount, bondDest);
      } else {
        // @ts-ignore
        bondTx = chainApi.api.tx.staking.bond(address, binaryAmount, bondDest);
      }

      nominateTx = chainApi.api.tx.staking.nominate(validatorParamList);

      return compoundTransactions(bondTx, nominateTx);
    }

    if (!positionInfo.isBondedBefore) { // first time
      if (paramsCount === 2) {
        bondTx = chainApi.api.tx.staking.bond(binaryAmount, bondDest);
      } else {
        // @ts-ignore
        bondTx = chainApi.api.tx.staking.bond(address, binaryAmount, bondDest);
      }

      nominateTx = chainApi.api.tx.staking.nominate(validatorParamList);

      return compoundTransactions(bondTx, nominateTx);
    } else {
      if (binaryAmount.gt(BN_ZERO)) {
        bondTx = chainApi.api.tx.staking.bondExtra(binaryAmount);
      }

      if (positionInfo.isBondedBefore && targetValidators.length > 0) {
        nominateTx = chainApi.api.tx.staking.nominate(validatorParamList);
      }
    }

    if (bondTx && !nominateTx) {
      // const feeInfo = await bondTx.paymentInfo(address);
      // const fee = feeInfo.toPrimitive() as unknown as RuntimeDispatchInfo;

      return [bondTx, { slug: tokenSlug, amount: '0' }];
    } else if (nominateTx && !bondTx) {
      // const feeInfo = await nominateTx.paymentInfo(address);
      // const fee = feeInfo.toPrimitive() as unknown as RuntimeDispatchInfo;

      return [nominateTx, { slug: tokenSlug, amount: '0' }];
    }

    if (bondTx && nominateTx) {
      return compoundTransactions(bondTx, nominateTx);
    } else {
      return Promise.reject(new TransactionError(BasicTxErrorType.INTERNAL_ERROR));
    }
  }

  /* Join pool action */

  /* Leave pool action */

  async validateYieldLeave (amount: string, address: string, fastLeave: boolean, selectedTarget?: string): Promise<TransactionError[]> {
    const errors: TransactionError[] = [];

    const poolInfo = await this.getPoolInfo();
    const poolPosition = await this.getPoolPosition(address);

    if (!poolInfo || !poolInfo.statistic || !poolPosition || fastLeave) {
      return [new TransactionError(BasicTxErrorType.INTERNAL_ERROR)];
    }

    if (fastLeave) {
      return [new TransactionError(BasicTxErrorType.INVALID_PARAMS)];
    }

    const bnAmount = new BN(amount);

    if (bnAmount.lte(BN_ZERO)) {
      errors.push(new TransactionError(BasicTxErrorType.INVALID_PARAMS, t('Amount must be greater than 0')));
    }

    const bnActiveStake = new BN(poolPosition.activeStake);
    const bnRemainingStake = bnActiveStake.sub(new BN(amount));
    const minStake = new BN(poolInfo.statistic.earningThreshold.join || '0');
    const maxUnstake = poolInfo.statistic.maxWithdrawalRequestPerFarmer;

    if (!(bnRemainingStake.isZero() || bnRemainingStake.gte(minStake))) {
      errors.push(new TransactionError(StakingTxErrorType.INVALID_ACTIVE_STAKE));
    }

    if (poolPosition.unstakings.length > maxUnstake) {
      errors.push(new TransactionError(StakingTxErrorType.EXCEED_MAX_UNSTAKING, t('You cannot unstake more than {{number}} times', { replace: { number: maxUnstake } })));
    }

    return Promise.resolve(errors);
  }

  async handleYieldUnstake (amount: string, address: string, selectedTarget?: string): Promise<[ExtrinsicType, TransactionData]> {
    const chainApi = await this.substrateApi.isReady;
    const poolPosition = await this.getPoolPosition(address);

    if (!poolPosition) {
      return Promise.reject(new TransactionError(BasicTxErrorType.INTERNAL_ERROR));
    }

    let extrinsic: TransactionData;
    const binaryAmount = new BN(amount);

    const isUnstakeAll = amount === poolPosition.activeStake;

    if (isUnstakeAll) {
      const chillTx = chainApi.api.tx.staking.chill();
      const unbondTx = chainApi.api.tx.staking.unbond(binaryAmount);

      extrinsic = chainApi.api.tx.utility.batchAll([chillTx, unbondTx]);
    } else {
      extrinsic = chainApi.api.tx.staking.unbond(binaryAmount);
    }

    return [ExtrinsicType.STAKING_LEAVE_POOL, extrinsic];
  }

  /* Leave pool action */

  /* Other action */

  async handleYieldCancelUnstake (params: StakeCancelWithdrawalParams): Promise<TransactionData> {
    const chainApi = await this.substrateApi.isReady;
    const { selectedUnstaking } = params;

    return chainApi.api.tx.staking.rebond(selectedUnstaking.claimable);
  }

  async handleYieldWithdraw (address: string, unstakingInfo: UnstakingInfo): Promise<TransactionData> {
    const chainApi = await this.substrateApi.isReady;

    if (chainApi.api.tx.staking.withdrawUnbonded.meta.args.length === 1) {
      const _slashingSpans = (await chainApi.api.query.staking.slashingSpans(address)).toHuman() as Record<string, any>;
      const slashingSpanCount = _slashingSpans !== null ? _slashingSpans.spanIndex as string : '0';

      return chainApi.api.tx.staking.withdrawUnbonded(slashingSpanCount);
    } else {
      // @ts-ignore
      return chainApi.api.tx.staking.withdrawUnbonded();
    }
  }

  /* Other actions */
}
