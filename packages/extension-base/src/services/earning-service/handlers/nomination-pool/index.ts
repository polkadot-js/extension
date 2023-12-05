// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { APIItemState, NominationInfo, OptimalYieldPath, OptimalYieldPathParams, UnstakingInfo } from '@subwallet/extension-base/background/KoniTypes';
import { PalletStakingNominations } from '@subwallet/extension-base/koni/api/staking/bonding/relayChain';
import { calculateChainStakedReturn, calculateInflation, PalletNominationPoolsPoolMember, PalletStakingExposure, parsePoolStashAddress, transformPoolName } from '@subwallet/extension-base/koni/api/staking/bonding/utils';
import KoniState from '@subwallet/extension-base/koni/background/handlers/State';
import { _STAKING_ERA_LENGTH_MAP } from '@subwallet/extension-base/services/chain-service/constants';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getChainNativeTokenSlug, _getChainSubstrateAddressPrefix } from '@subwallet/extension-base/services/chain-service/utils';
import { EarningRewardItem, EarningStatus, NormalYieldPoolInfo, UnstakingStatus, YieldPoolGroup, YieldPoolInfo, YieldPoolType, YieldPositionInfo } from '@subwallet/extension-base/types';
import { balanceFormatter, formatNumber, reformatAddress } from '@subwallet/extension-base/utils';

import { UnsubscribePromise } from '@polkadot/api-base/types/base';
import { Bytes } from '@polkadot/types';
import { Codec } from '@polkadot/types/types';
import { BN, BN_ZERO } from '@polkadot/util';

import BasePoolHandler from '../base';

export default class NominationPoolHandler extends BasePoolHandler {
  type: YieldPoolType.NOMINATION_POOL = YieldPoolType.NOMINATION_POOL;
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

  generateOptimalPath (params: OptimalYieldPathParams): Promise<OptimalYieldPath> {
    throw new Error('Need handle');
  }
}
