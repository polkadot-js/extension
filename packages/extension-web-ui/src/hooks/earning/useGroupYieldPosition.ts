// Copyright 2019-2022 @polkadot/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ALL_ACCOUNT_KEY } from '@subwallet/extension-base/constants';
import { AbstractYieldPositionInfo, EarningStatus, LendingYieldPositionInfo, LiquidYieldPositionInfo, NativeYieldPositionInfo, NominationYieldPositionInfo, YieldPoolType, YieldPositionInfo } from '@subwallet/extension-base/types';
import { isAccountAll, isSameAddress } from '@subwallet/extension-base/utils';
import { useGetChainSlugsByAccountType, useSelector } from '@subwallet/extension-web-ui/hooks';
import { isRelatedToAstar } from '@subwallet/extension-web-ui/utils';
import BigN from 'bignumber.js';
import { useMemo } from 'react';

const useGroupYieldPosition = (): YieldPositionInfo[] => {
  const poolInfoMap = useSelector((state) => state.earning.poolInfoMap);
  const yieldPositions = useSelector((state) => state.earning.yieldPositions);
  const { currentAccount } = useSelector((state) => state.accountState);
  const chainsByAccountType = useGetChainSlugsByAccountType();

  return useMemo(() => {
    const raw: Record<string, YieldPositionInfo[]> = {};
    const result: YieldPositionInfo[] = [];

    const address = currentAccount?.address || '';
    const isAll = isAccountAll(address);

    const checkAddress = (item: YieldPositionInfo) => {
      if (isAll) {
        return true;
      } else {
        return isSameAddress(address, item.address);
      }
    };

    for (const info of yieldPositions) {
      if (chainsByAccountType.includes(info.chain) && poolInfoMap[info.slug]) {
        const isValid = checkAddress(info);
        const haveStake = new BigN(info.totalStake).gt(0);

        const _isRelatedToAstar = isRelatedToAstar(info.slug);

        if (isValid && haveStake && !_isRelatedToAstar) {
          if (raw[info.slug]) {
            raw[info.slug].push(info);
          } else {
            raw[info.slug] = [info];
          }
        }
      }
    }

    for (const [slug, infoList] of Object.entries(raw)) {
      const positionInfo = infoList[0];

      if (!positionInfo) {
        continue;
      }

      if (isAll) {
        const base: AbstractYieldPositionInfo = {
          slug: slug,
          chain: positionInfo.chain,
          type: positionInfo.type,
          address: ALL_ACCOUNT_KEY,
          group: positionInfo.group,
          balanceToken: positionInfo.balanceToken,
          totalStake: '0',
          activeStake: '0',
          unstakeBalance: '0',
          nominations: [],
          status: EarningStatus.NOT_STAKING,
          unstakings: [],
          isBondedBefore: false
        };

        let rs: YieldPositionInfo;

        switch (positionInfo.type) {
          case YieldPoolType.LENDING:
            rs = {
              ...base,
              derivativeToken: positionInfo.derivativeToken
            } as LendingYieldPositionInfo;
            break;
          case YieldPoolType.LIQUID_STAKING:
            rs = {
              ...base,
              derivativeToken: positionInfo.derivativeToken
            } as LiquidYieldPositionInfo;
            break;
          case YieldPoolType.NATIVE_STAKING:
            rs = {
              ...base
            } as NativeYieldPositionInfo;
            break;
          case YieldPoolType.NOMINATION_POOL:
            rs = {
              ...base
            } as NominationYieldPositionInfo;
            break;
        }

        const statuses: EarningStatus[] = [];

        for (const info of infoList) {
          rs.totalStake = new BigN(rs.totalStake).plus(info.totalStake).toString();
          rs.activeStake = new BigN(rs.activeStake).plus(info.activeStake).toString();
          rs.unstakeBalance = new BigN(rs.unstakeBalance).plus(info.unstakeBalance).toString();
          rs.isBondedBefore = rs.isBondedBefore || info.isBondedBefore;
          statuses.push(info.status);
        }

        let status: EarningStatus;

        if (statuses.every((st) => st === EarningStatus.WAITING)) {
          status = EarningStatus.WAITING;
        } else if (statuses.every((st) => st === EarningStatus.NOT_EARNING)) {
          status = EarningStatus.NOT_EARNING;
        } else if (statuses.every((st) => st === EarningStatus.EARNING_REWARD)) {
          status = EarningStatus.EARNING_REWARD;
        } else {
          status = EarningStatus.PARTIALLY_EARNING;
        }

        rs.status = status;

        result.push(rs);
      } else {
        result.push(positionInfo);
      }
    }

    return result;
  }, [chainsByAccountType, currentAccount?.address, poolInfoMap, yieldPositions]);
};

export default useGroupYieldPosition;
