// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ALL_ACCOUNT_KEY } from '@subwallet/extension-base/constants';
import { AbstractYieldPositionInfo, EarningStatus, LendingYieldPositionInfo, LiquidYieldPositionInfo, NativeYieldPositionInfo, NominationYieldPositionInfo, YieldPoolType, YieldPositionInfo } from '@subwallet/extension-base/types';
import { isAccountAll, isSameAddress } from '@subwallet/extension-base/utils';
import { useGetChainSlugsByAccountType, useSelector } from '@subwallet/extension-koni-ui/hooks';
import BigN from 'bignumber.js';
import { useMemo } from 'react';

interface Result {
  compound: YieldPositionInfo | undefined;
  list: YieldPositionInfo[];
}

const useYieldPositionDetail = (slug: string, address?: string): Result => {
  const { poolInfoMap, yieldPositions } = useSelector((state) => state.earning);
  const { currentAccount } = useSelector((state) => state.accountState);
  const chainsByAccountType = useGetChainSlugsByAccountType();

  return useMemo(() => {
    const _address = address || currentAccount?.address || '';
    const isAll = isAccountAll(_address);

    const checkAddress = (item: YieldPositionInfo) => {
      if (isAll) {
        return true;
      } else {
        return isSameAddress(_address, item.address);
      }
    };

    const infoList: YieldPositionInfo[] = [];

    for (const info of yieldPositions) {
      if (chainsByAccountType.includes(info.chain) && poolInfoMap[info.slug]) {
        const isValid = checkAddress(info);
        const haveStake = new BigN(info.totalStake).gt(0);

        if (isValid && haveStake && info.slug === slug) {
          infoList.push(info);
        }
      }
    }

    if (infoList.length) {
      if (isAll) {
        const positionInfo = infoList[0];
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
          status: EarningStatus.NOT_STAKING, // TODO
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
          rs.unstakings.push(...info.unstakings);
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

        return {
          compound: rs,
          list: infoList
        };
      } else {
        return {
          compound: infoList[0],
          list: infoList
        };
      }
    } else {
      return {
        compound: undefined,
        list: infoList
      };
    }
  }, [chainsByAccountType, currentAccount?.address, poolInfoMap, slug, yieldPositions, address]);
};

export default useYieldPositionDetail;
