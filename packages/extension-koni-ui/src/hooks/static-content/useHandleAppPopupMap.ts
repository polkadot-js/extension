// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { YieldPositionInfo } from '@subwallet/extension-base/types';
import { updateAppPopupData, updatePopupHistoryData } from '@subwallet/extension-koni-ui/stores/base/StaticContent';
import { AppBasicInfoData, AppPopupData, ConditionBalanceType, ConditionEarningType, PopupHistoryData } from '@subwallet/extension-koni-ui/types/staticContent';
import { useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';

export interface AppPopupHookType {
  setAppPopupData: (data: AppPopupData[]) => void;
  updatePopupHistoryMap: (id: string) => void;
  appPopupMap: Record<string, AppPopupData[]>;
}

export const useHandleAppPopupMap = (
  appPopupData: AppPopupData[],
  popupHistoryMap: Record<string, PopupHistoryData>,
  yieldPositionList: YieldPositionInfo[],
  checkPopupExistTime: (info: AppBasicInfoData) => boolean,
  checkBalanceCondition: (conditionBalance: ConditionBalanceType[]) => boolean,
  checkEarningCondition: (_yieldPositionList: YieldPositionInfo[], conditionEarning: ConditionEarningType[]) => boolean
): AppPopupHookType => {
  const dispatch = useDispatch();

  const getFilteredAppPopupByTimeAndPlatform = useCallback(
    (data: AppPopupData[]) => {
      const activeList = data.filter(({ info }) => checkPopupExistTime(info));
      const filteredData = activeList
        .filter(({ info }) => info.platforms.includes('extension'))
        .sort((a, b) => a.priority - b.priority);

      dispatch(updateAppPopupData(filteredData));
    },
    [checkPopupExistTime, dispatch]
  );

  const initPopupHistoryMap = useCallback((data: AppPopupData[]) => {
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
    const result = { ...newData, ...popupHistoryMap };

    dispatch(updatePopupHistoryData(result));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setAppPopupData = useCallback(
    (data: AppPopupData[]) => {
      getFilteredAppPopupByTimeAndPlatform(data);
      initPopupHistoryMap(data);
    },
    [getFilteredAppPopupByTimeAndPlatform, initPopupHistoryMap]
  );

  const updatePopupHistoryMap = useCallback(
    (id: string) => {
      dispatch(
        updatePopupHistoryData({
          ...popupHistoryMap,
          [id]: { lastShowTime: Date.now(), showTimes: popupHistoryMap[id].showTimes + 1 }
        })
      );
    },
    [dispatch, popupHistoryMap]
  );

  const filteredAppPopupMap = useMemo(() => {
    return appPopupData.filter((item) => {
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
  }, [appPopupData, checkBalanceCondition, checkEarningCondition, yieldPositionList]);

  const appPopupMap = useMemo(() => {
    if (filteredAppPopupMap) {
      const result: Record<string, AppPopupData[]> = filteredAppPopupMap.reduce((r, a) => {
        r[a.position] = r[a.position] || [];
        r[a.position].push(a);

        return r;
      }, Object.create(null));

      return result;
    } else {
      return {};
    }
  }, [filteredAppPopupMap]);

  return {
    setAppPopupData,
    updatePopupHistoryMap,
    appPopupMap
  };
};
