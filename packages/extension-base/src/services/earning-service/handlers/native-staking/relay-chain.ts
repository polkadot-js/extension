// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { BasicTxErrorType, ExtrinsicType, NominationInfo, StakingTxErrorType, UnstakingInfo } from '@subwallet/extension-base/background/KoniTypes';
import { calculateAlephZeroValidatorReturn, calculateChainStakedReturn, calculateInflation, calculateTernoaValidatorReturn, calculateValidatorStakedReturn, getCommission, getMaxValidatorErrorMessage, getMinStakeErrorMessage } from '@subwallet/extension-base/koni/api/staking/bonding/utils';
import { _STAKING_ERA_LENGTH_MAP } from '@subwallet/extension-base/services/chain-service/constants';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getChainNativeTokenSlug, _getChainSubstrateAddressPrefix } from '@subwallet/extension-base/services/chain-service/utils';
import { _STAKING_CHAIN_GROUP } from '@subwallet/extension-base/services/earning-service/constants';
import { parseIdentity } from '@subwallet/extension-base/services/earning-service/utils';
import { BaseYieldPositionInfo, EarningStatus, NativeYieldPoolInfo, OptimalYieldPath, PalletStakingExposure, PalletStakingNominations, PalletStakingStakingLedger, RuntimeDispatchInfo, StakeCancelWithdrawalParams, SubmitJoinNativeStaking, SubmitYieldJoinData, TernoaStakingRewardsStakingRewardsData, TransactionData, UnstakingStatus, ValidatorExtraInfo, ValidatorInfo, YieldPoolInfo, YieldPositionInfo, YieldTokenBaseInfo } from '@subwallet/extension-base/types';
import { balanceFormatter, formatNumber, reformatAddress } from '@subwallet/extension-base/utils';
import { t } from 'i18next';

import { SubmittableExtrinsic } from '@polkadot/api/types';
import { UnsubscribePromise } from '@polkadot/api-base/types/base';
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
    const defaultData = this.defaultInfo;

    await substrateApi.isReady;

    const unsub = await (substrateApi.api.query.staking?.currentEra(async (_currentEra: Codec) => {
      if (cancel) {
        unsub();

        return;
      }

      const currentEra = _currentEra.toString();
      const maxNominations = substrateApi.api.consts.staking?.maxNominations?.toString() || '16'; // TODO
      const maxUnlockingChunks = substrateApi.api.consts.staking.maxUnlockingChunks.toString();
      const unlockingEras = substrateApi.api.consts.staking.bondingDuration.toString();

      const [_totalEraStake, _totalIssuance, _auctionCounter, _minNominatorBond, _counterForNominators, _minimumActiveStake] = await Promise.all([
        substrateApi.api.query.staking.erasTotalStake(parseInt(currentEra)),
        substrateApi.api.query.balances.totalIssuance(),
        substrateApi.api.query.auctions?.auctionCounter(),
        substrateApi.api.query.staking.minNominatorBond(),
        substrateApi.api.query.staking.counterForNominators(),
        substrateApi.api.query?.staking?.minimumActiveStake && substrateApi.api.query?.staking?.minimumActiveStake()
      ]);

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
      const expectedReturn = calculateChainStakedReturn(inflation, bnTotalEraStake, bnTotalIssuance, chainInfo.slug);
      const unlockingPeriod = parseInt(unlockingEras) * (_STAKING_ERA_LENGTH_MAP[chainInfo.slug] || _STAKING_ERA_LENGTH_MAP.default); // in hours
      const farmerCount = _counterForNominators.toPrimitive() as number;

      const minToHuman = formatNumber(minStake.toString(), nativeToken.decimals || 0, balanceFormatter);

      const data: NativeYieldPoolInfo = {
        // TODO
        ...defaultData,
        description: this.description.replaceAll('{{amount}}', minToHuman),
        type: this.type,
        metadata: {
          inputAsset: nativeToken.slug,
          isAvailable: true,
          maxCandidatePerFarmer: parseInt(maxNominations),
          maxWithdrawalRequestPerFarmer: parseInt(maxUnlockingChunks), // TODO recheck
          minJoinPool: minStake.toString(),
          farmerCount: farmerCount,
          era: parseInt(currentEra),
          tvl: bnTotalEraStake.toString(), // TODO recheck
          totalApy: expectedReturn, // TODO recheck
          unstakingPeriod: unlockingPeriod,
          allowCancelUnstaking: true,
          inflation: inflation
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

  async parseNominatorMetadata (chainInfo: _ChainInfo, address: string, substrateApi: _SubstrateApi, ledger: PalletStakingStakingLedger): Promise<Omit<YieldPositionInfo, keyof BaseYieldPositionInfo>> {
    const chain = chainInfo.slug;

    const [_nominations, _currentEra, _bonded, _minimumActiveStake, _minNominatorBond] = await Promise.all([
      substrateApi.api.query?.staking?.nominators(address),
      substrateApi.api.query?.staking?.currentEra(),
      substrateApi.api.query?.staking?.bonded(address),
      substrateApi.api.query?.staking?.minimumActiveStake && substrateApi.api.query?.staking?.minimumActiveStake(),
      substrateApi.api.query?.staking?.minNominatorBond()
    ]);

    const minActiveStake = _minimumActiveStake?.toString() || '0';
    const minNominatorBond = _minNominatorBond.toString();

    const bnMinActiveStake = new BN(minActiveStake);
    const bnMinNominatorBond = new BN(minNominatorBond);

    const minStake = bnMinActiveStake.gt(bnMinNominatorBond) ? bnMinActiveStake : bnMinNominatorBond;

    const unlimitedNominatorRewarded = substrateApi.api.consts.staking.maxExposurePageSize !== undefined;
    const _maxNominatorRewardedPerValidator = (substrateApi.api.consts.staking.maxNominatorRewardedPerValidator || 0).toString();
    const maxNominatorRewardedPerValidator = parseInt(_maxNominatorRewardedPerValidator);
    const nominations = _nominations.toPrimitive() as unknown as PalletStakingNominations;
    const currentEra = _currentEra.toString();
    const bonded = _bonded.toHuman();

    const activeStake = ledger.active.toString();
    const totalStake = ledger.total.toString();
    const unstakingBalance = (ledger.total - ledger.active).toString();
    const nominationList: NominationInfo[] = [];
    const unstakingList: UnstakingInfo[] = [];

    if (nominations) {
      const validatorList = nominations.targets;

      await Promise.all(validatorList.map(async (validatorAddress) => {
        let nominationStatus = EarningStatus.NOT_EARNING;
        const [[identity], _eraStaker] = await Promise.all([
          parseIdentity(substrateApi, validatorAddress),
          substrateApi.api.query.staking.erasStakers(currentEra, validatorAddress)
        ]);
        const eraStaker = _eraStaker.toPrimitive() as unknown as PalletStakingExposure;
        const topNominators = eraStaker.others.map((nominator) => {
          return nominator.who;
        });

        if (!topNominators.includes(reformatAddress(address, _getChainSubstrateAddressPrefix(chainInfo)))) { // if nominator has target but not in nominator list
          nominationStatus = EarningStatus.WAITING;
        } else if (topNominators.slice(0, unlimitedNominatorRewarded ? undefined : maxNominatorRewardedPerValidator).includes(reformatAddress(address, _getChainSubstrateAddressPrefix(chainInfo)))) { // if address in top nominators
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
    }

    let stakingStatus = EarningStatus.NOT_EARNING;
    const bnActiveStake = new BN(activeStake);
    let waitingNominationCount = 0;

    if (bnActiveStake.gte(minStake)) {
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
      const isClaimable = unlockingChunk.era - parseInt(currentEra) < 0;
      const remainingEra = unlockingChunk.era - parseInt(currentEra);
      const waitingTime = remainingEra * _STAKING_ERA_LENGTH_MAP[chain];

      unstakingList.push({
        chain,
        status: isClaimable ? UnstakingStatus.CLAIMABLE : UnstakingStatus.UNLOCKING,
        claimable: unlockingChunk.value.toString(),
        waitingTime: waitingTime
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

  async subscribePoolPosition (useAddresses: string[], resultCallback: (rs: YieldPositionInfo) => void): Promise<VoidFunction> {
    let cancel = false;
    const substrateApi = await this.substrateApi.isReady;
    const defaultInfo = this.defaultInfo;
    const chainInfo = this.chainInfo;

    const unsub = await substrateApi.api.query.staking?.ledger.multi(useAddresses, async (ledgers: Codec[]) => {
      if (cancel) {
        unsub();

        return;
      }

      if (ledgers) {
        await Promise.all(ledgers.map(async (_ledger: Codec, i) => {
          const owner = reformatAddress(useAddresses[i], 42);
          const ledger = _ledger.toPrimitive() as unknown as PalletStakingStakingLedger;

          if (ledger) {
            const nominatorMetadata = await this.parseNominatorMetadata(chainInfo, owner, substrateApi, ledger);

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
    const decimals = this.nativeToken.decimals || 0;

    const chainApi = await this.substrateApi.isReady;
    const poolInfo = await this.getPoolInfo();

    if (!poolInfo) {
      return Promise.reject(new TransactionError(BasicTxErrorType.INTERNAL_ERROR));
    }

    const _era = await chainApi.api.query.staking.currentEra();
    const currentEra = _era.toString();

    const allValidators: string[] = [];
    const validatorInfoList: ValidatorInfo[] = [];

    const [_totalEraStake, _eraStakers, _minBond, _stakingRewards] = await Promise.all([
      chainApi.api.query.staking.erasTotalStake(parseInt(currentEra)),
      chainApi.api.query.staking.erasStakers.entries(parseInt(currentEra)),
      chainApi.api.query.staking.minNominatorBond(),
      chainApi.api.query.stakingRewards?.data && chainApi.api.query.stakingRewards.data()
    ]);

    const stakingRewards = _stakingRewards?.toPrimitive() as unknown as TernoaStakingRewardsStakingRewardsData;

    const unlimitedNominatorRewarded = chainApi.api.consts.staking.maxExposurePageSize !== undefined;
    const maxNominatorRewarded = (chainApi.api.consts.staking.maxNominatorRewardedPerValidator || 0).toString();
    const bnTotalEraStake = new BN(_totalEraStake.toString());
    const eraStakers = _eraStakers as any[];

    const rawMinBond = _minBond.toHuman() as string;
    const minBond = rawMinBond.replaceAll(',', '');

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
        minBond,
        isCrowded: unlimitedNominatorRewarded ? false : nominatorCount > parseInt(maxNominatorRewarded)
      } as ValidatorInfo);
    }

    const extraInfoMap: Record<string, ValidatorExtraInfo> = {};

    await Promise.all(allValidators.map(async (address) => {
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

    const bnAvgStake = bnTotalEraStake.divn(validatorInfoList.length).div(bnDecimals);

    for (const validator of validatorInfoList) {
      const commission = extraInfoMap[validator.address].commission;

      const bnValidatorStake = totalStakeMap[validator.address].div(bnDecimals);

      if (_STAKING_CHAIN_GROUP.aleph.includes(this.chain)) {
        validator.expectedReturn = calculateAlephZeroValidatorReturn(poolInfo.metadata.totalApy as number, getCommission(commission));
      } else if (_STAKING_CHAIN_GROUP.ternoa.includes(this.chain)) {
        const rewardPerValidator = new BN(stakingRewards.sessionExtraRewardPayout).divn(allValidators.length).div(bnDecimals);
        const validatorStake = totalStakeMap[validator.address].div(bnDecimals).toNumber();

        validator.expectedReturn = calculateTernoaValidatorReturn(rewardPerValidator.toNumber(), validatorStake, getCommission(commission));
      } else {
        validator.expectedReturn = calculateValidatorStakedReturn(poolInfo.metadata.totalApy as number, bnValidatorStake, bnAvgStake, getCommission(commission));
      }

      validator.commission = parseFloat(commission.split('%')[0]);
      validator.blocked = extraInfoMap[validator.address].blocked;
      validator.identity = extraInfoMap[validator.address].identity;
      validator.isVerified = extraInfoMap[validator.address].isVerified;
    }

    return validatorInfoList;
  }

  /* Get pool targets */

  /* Join pool action */

  async validateYieldJoin (data: SubmitYieldJoinData, path: OptimalYieldPath): Promise<TransactionError[]> {
    const { address, amount, selectedValidators } = data as SubmitJoinNativeStaking;
    const _poolInfo = await this.getPoolInfo();
    const poolPosition = await this.getPoolPosition(address);
    const chainInfo = this.chainInfo;

    if (!_poolInfo) {
      return Promise.resolve([new TransactionError(BasicTxErrorType.INTERNAL_ERROR)]);
    }

    const poolInfo = _poolInfo as NativeYieldPoolInfo;

    const errors: TransactionError[] = [];
    let bnTotalStake = new BN(amount);
    const bnMinStake = new BN(poolInfo.metadata.minJoinPool);
    const minStakeErrorMessage = getMinStakeErrorMessage(chainInfo, bnMinStake);
    const maxValidatorErrorMessage = getMaxValidatorErrorMessage(chainInfo, poolInfo.metadata.maxCandidatePerFarmer);

    if (!poolPosition || poolPosition.status === EarningStatus.NOT_STAKING) {
      if (!bnTotalStake.gte(bnMinStake)) {
        errors.push(new TransactionError(StakingTxErrorType.NOT_ENOUGH_MIN_STAKE, minStakeErrorMessage));
      }

      if (selectedValidators.length > poolInfo.metadata.maxCandidatePerFarmer) {
        errors.push(new TransactionError(StakingTxErrorType.EXCEED_MAX_NOMINATIONS, maxValidatorErrorMessage));
      }

      return errors;
    }

    const bnCurrentActiveStake = new BN(poolPosition.activeStake);

    bnTotalStake = bnTotalStake.add(bnCurrentActiveStake);

    if (!bnTotalStake.gte(bnMinStake)) {
      errors.push(new TransactionError(StakingTxErrorType.NOT_ENOUGH_MIN_STAKE, minStakeErrorMessage));
    }

    if (selectedValidators.length > poolInfo.metadata.maxCandidatePerFarmer) {
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

    const compoundTransactions = async (bondTx: SubmittableExtrinsic<'promise'>, nominateTx: SubmittableExtrinsic<'promise'>): Promise<[TransactionData, YieldTokenBaseInfo]> => {
      const extrinsic = chainApi.api.tx.utility.batchAll([bondTx, nominateTx]);
      const fees = await Promise.all([bondTx.paymentInfo(address), nominateTx.paymentInfo(address)]);
      const totalFee = fees.reduce((previousValue, currentItem) => {
        const fee = currentItem.toPrimitive() as unknown as RuntimeDispatchInfo;

        return previousValue + fee.partialFee;
      }, 0);

      return [extrinsic, { slug: tokenSlug, amount: totalFee.toString() }];
    };

    if (!positionInfo) {
      if (paramsCount === 2) {
        bondTx = chainApi.api.tx.staking.bond(binaryAmount, bondDest);
      } else {
        bondTx = chainApi.api.tx.staking.bond(address, binaryAmount, bondDest);
      }

      nominateTx = chainApi.api.tx.staking.nominate(validatorParamList);

      return compoundTransactions(bondTx, nominateTx);
    }

    if (!positionInfo.isBondedBefore) { // first time
      if (paramsCount === 2) {
        bondTx = chainApi.api.tx.staking.bond(binaryAmount, bondDest);
      } else {
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
      const feeInfo = await bondTx.paymentInfo(address);
      const fee = feeInfo.toPrimitive() as unknown as RuntimeDispatchInfo;

      return [bondTx, { slug: tokenSlug, amount: fee.partialFee.toString() }];
    } else if (nominateTx && !bondTx) {
      const feeInfo = await nominateTx.paymentInfo(address);
      const fee = feeInfo.toPrimitive() as unknown as RuntimeDispatchInfo;

      return [nominateTx, { slug: tokenSlug, amount: fee.partialFee.toString() }];
    }

    if (bondTx && nominateTx) {
      return compoundTransactions(bondTx, nominateTx);
    } else {
      return Promise.reject(new TransactionError(BasicTxErrorType.INTERNAL_ERROR));
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

    if (!poolInfo || !poolPosition || fastLeave) {
      return [new TransactionError(BasicTxErrorType.INTERNAL_ERROR)];
    }

    if (fastLeave) {
      return [new TransactionError(BasicTxErrorType.INVALID_PARAMS)];
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

  async handleYieldUnstake (amount: string, address: string, selectedTarget?: string): Promise<[ExtrinsicType, TransactionData]> {
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
      return chainApi.api.tx.staking.withdrawUnbonded();
    }
  }

  /* Other actions */
}
