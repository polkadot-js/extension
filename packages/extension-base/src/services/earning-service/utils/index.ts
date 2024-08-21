// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { PalletIdentityRegistration, PalletIdentitySuper } from '@subwallet/extension-base/koni/api/staking/bonding/utils';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _STAKING_CHAIN_GROUP } from '@subwallet/extension-base/services/earning-service/constants';
import { LendingYieldPoolInfo, LiquidYieldPoolInfo, NativeYieldPoolInfo, NominationYieldPoolInfo, YieldAssetExpectedEarning, YieldCompoundingPeriod, YieldPoolInfo, YieldPoolType } from '@subwallet/extension-base/types';

import { BN, hexToString, isHex } from '@polkadot/util';

export function calculateReward (apr: number, amount = 0, compoundingPeriod = YieldCompoundingPeriod.YEARLY, isApy = false): YieldAssetExpectedEarning {
  if (!apr) {
    return {};
  }

  if (!isApy) {
    const periodApr = apr / 365 * compoundingPeriod; // APR is always annually
    const earningRatio = (periodApr / 100) / compoundingPeriod;

    const periodApy = (1 + earningRatio) ** compoundingPeriod - 1;

    const reward = periodApy * amount;

    return {
      apy: periodApy * 100,
      rewardInToken: reward
    };
  } else {
    const reward = (apr / 100) * amount;

    return {
      apy: apr,
      rewardInToken: reward * (compoundingPeriod / YieldCompoundingPeriod.YEARLY)
    };
  }
}

/**
 * @returns
 * <p>
 * [0] - identity
 * </p>
 * <p>
 * [1] - isReasonable (isVerified)
 * </p>
 *  */
export async function parseIdentity (substrateApi: _SubstrateApi, address: string, children?: string): Promise<[string | undefined, boolean]> {
  const compactResult = (rs?: string) => {
    const result: string[] = [];

    if (rs) {
      result.push(rs);
    }

    if (children) {
      result.push(children);
    }

    if (result.length > 0) {
      return result.join('/');
    } else {
      return undefined;
    }
  };

  if (substrateApi.api.query.identity) {
    let identity;
    const _parent = await substrateApi.api.query.identity.superOf(address);

    const parentInfo = _parent?.toHuman() as unknown as PalletIdentitySuper;

    if (parentInfo) {
      const [parentAddress, { Raw: data }] = parentInfo;
      const child = isHex(data) ? hexToString(data) : data;

      // TODO: Re-check
      if (address !== parentAddress) {
        const [rs, isReasonable] = await parseIdentity(substrateApi, parentAddress, child);

        return [compactResult(rs), isReasonable];
      }
    }

    let identityInfo;

    const _identity = await substrateApi.api.query.identity.identityOf(address);
    const identityOfMetadata = substrateApi.api.query.identity.identityOf.creator.meta;
    const identityOfReturnType = substrateApi.api.registry.lookup.getName(identityOfMetadata.type.asMap.value);

    if (identityOfReturnType === 'PalletIdentityRegistration') {
      identityInfo = _identity.toHuman() as unknown as PalletIdentityRegistration;
    } else {
      const _identityInfo = _identity?.toHuman() as unknown as [PalletIdentityRegistration, any];

      identityInfo = _identityInfo ? _identityInfo[0] : undefined;
    }

    if (identityInfo) {
      const displayName = identityInfo.info?.display?.Raw;
      const web = identityInfo.info?.web?.Raw;
      const riot = identityInfo.info?.riot?.Raw;
      const twitter = identityInfo.info?.twitter?.Raw;
      const isReasonable = identityInfo.judgements?.length > 0;

      if (displayName) {
        identity = isHex(displayName) ? hexToString(displayName) : displayName;
      } else {
        identity = twitter || web || riot;
      }

      return [compactResult(identity), isReasonable];
    }
  }

  return [undefined, false];
}

export function isActionFromValidator (stakingType: YieldPoolType, chain: string) {
  if (stakingType === YieldPoolType.NOMINATION_POOL || stakingType === YieldPoolType.LIQUID_STAKING || stakingType === YieldPoolType.LENDING) {
    return false;
  }

  if (_STAKING_CHAIN_GROUP.astar.includes(chain)) {
    return true;
  } else if (_STAKING_CHAIN_GROUP.amplitude.includes(chain)) {
    return true;
  } else if (_STAKING_CHAIN_GROUP.para.includes(chain)) {
    return true;
  }

  return false;
}

export const isNominationPool = (pool: YieldPoolInfo): pool is NominationYieldPoolInfo => {
  return pool.type === YieldPoolType.NOMINATION_POOL;
};

export const isNativeStakingPool = (pool: YieldPoolInfo): pool is NativeYieldPoolInfo => {
  return pool.type === YieldPoolType.NATIVE_STAKING;
};

export const isLiquidPool = (pool: YieldPoolInfo): pool is LiquidYieldPoolInfo => {
  return pool.type === YieldPoolType.LIQUID_STAKING;
};

export const isLendingPool = (pool: YieldPoolInfo): pool is LendingYieldPoolInfo => {
  return pool.type === YieldPoolType.LENDING;
};

export function applyDecimal (bnNumber: BN, decimals: number) {
  const bnDecimals = new BN((10 ** decimals).toString());

  return bnNumber.div(bnDecimals);
}
