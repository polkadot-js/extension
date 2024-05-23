// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { YieldPositionInfo } from '@subwallet/extension-base/types';
import { updateAppBannerData, updateBannerHistoryData } from '@subwallet/extension-koni-ui/stores/base/StaticContent';
import {
  AppBannerData,
  AppBasicInfoData,
  ConditionBalanceType,
  ConditionEarningType,
  PopupHistoryData
} from '@subwallet/extension-koni-ui/types/staticContent';
import { useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';

export interface AppBannerHookType {
  setAppBannerData: (data: AppBannerData[]) => void;
  updateBannerHistoryMap: (ids: string[]) => void;
  appBannerMap: Record<string, AppBannerData[]>;
}

export const useHandleAppBannerMap = (
  appBannerData: AppBannerData[],
  bannerHistoryMap: Record<string, PopupHistoryData>,
  yieldPositionList: YieldPositionInfo[],
  checkPopupExistTime: (info: AppBasicInfoData) => boolean,
  checkBalanceCondition: (conditionBalance: ConditionBalanceType[]) => boolean,
  checkEarningCondition: (_yieldPositionList: YieldPositionInfo[], conditionEarning: ConditionEarningType[]) => boolean
): AppBannerHookType => {
  const dispatch = useDispatch();

  const getFilteredAppBannerByTimeAndPlatform = useCallback(
    (data: AppBannerData[]) => {
      const activeList = data.filter(({ info }) => checkPopupExistTime(info));
      const filteredData = activeList
        .filter(({ info }) => {
          return info.platforms.includes('mobile');
        })
        .sort((a, b) => a.priority - b.priority);

      dispatch(updateAppBannerData(filteredData));
    },
    [checkPopupExistTime, dispatch]
  );

  const initBannerHistoryMap = useCallback((data: AppBannerData[]) => {
    const newData: Record<string, PopupHistoryData> = data.reduce(
      (o, key) =>
        Object.assign(o, {
          [`${key.position}-${key.id}`]: {
            lastShowTime: 0,
            showTimes: 0
          }
        }),
      {}
    );
    const result = { ...newData, ...bannerHistoryMap };

    dispatch(updateBannerHistoryData(result));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setAppBannerData = useCallback(
    (data: AppBannerData[]) => {
      getFilteredAppBannerByTimeAndPlatform(data);
      initBannerHistoryMap(data);
    },
    [getFilteredAppBannerByTimeAndPlatform, initBannerHistoryMap]
  );
  const updateBannerHistoryMap = useCallback(
    (ids: string[]) => {
      const result: Record<string, PopupHistoryData> = {};

      for (const key of ids) {
        result[key] = { lastShowTime: Date.now(), showTimes: bannerHistoryMap[key].showTimes + 1 };
      }

      dispatch(
        updateBannerHistoryData({
          ...bannerHistoryMap,
          ...result
        })
      );
    },
    [bannerHistoryMap, dispatch]
  );

  const filteredAppBannerMap = useMemo(() => {
    return appBannerData.filter((item) => {
      if (!!Object.keys(item.conditions) && !!Object.keys(item.conditions).length) {
        const isPassBalanceCondition = item.conditions['condition-balance']
          ? checkBalanceCondition(item.conditions['condition-balance'])
          : true;

        const isPassEarningCondition = item.conditions['condition-earning']
          ? checkEarningCondition(yieldPositionList, item.conditions['condition-earning'])
          : true;

        return isPassBalanceCondition || isPassEarningCondition;
      } else {
        return true;
      }
    });
  }, [appBannerData, checkBalanceCondition, checkEarningCondition, yieldPositionList]);

  const appBannerMap = useMemo(() => {
    if (filteredAppBannerMap) {
      const result: Record<string, AppBannerData[]> = filteredAppBannerMap.reduce((r, a) => {
        r[a.position] = r[a.position] || [];
        r[a.position].push(a);

        return r;
      }, Object.create(null));

      return result;
    } else {
      return {};
    }
  }, [filteredAppBannerMap]);

  return {
    setAppBannerData,
    updateBannerHistoryMap,
    appBannerMap
  };
};
