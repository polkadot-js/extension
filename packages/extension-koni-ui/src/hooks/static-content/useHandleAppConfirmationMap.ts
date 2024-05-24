// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { YieldPositionInfo } from '@subwallet/extension-base/types';
import { updateAppConfirmationData, updateConfirmationHistoryData } from '@subwallet/extension-koni-ui/stores/base/StaticContent';
import { AppConfirmationData, ConditionBalanceType, ConditionEarningType, PopupHistoryData } from '@subwallet/extension-koni-ui/types/staticContent';
import { useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';

export interface AppConfirmationHookType {
  setAppConfirmationData: (data: AppConfirmationData[]) => void;
  updateConfirmationHistoryMap: (id: string) => void;
  appConfirmationMap: Record<string, AppConfirmationData[]>;
}

export const useHandleAppConfirmationMap = (
  appConfirmationData: AppConfirmationData[],
  confirmationHistoryMap: Record<string, PopupHistoryData>,
  yieldPositionList: YieldPositionInfo[],
  checkBalanceCondition: (conditionBalance: ConditionBalanceType[]) => boolean,
  checkEarningCondition: (_yieldPositionList: YieldPositionInfo[], conditionEarning: ConditionEarningType[]) => boolean
): AppConfirmationHookType => {
  const dispatch = useDispatch();

  const getFilteredAppConfirmationByTimeAndPlatform = useCallback(
    (data: AppConfirmationData[]) => {
      dispatch(updateAppConfirmationData(data));
    },
    [dispatch]
  );

  const initConfirmationHistoryMap = useCallback((data: AppConfirmationData[]) => {
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
    const result = { ...newData, ...confirmationHistoryMap };

    dispatch(updateConfirmationHistoryData(result));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setAppConfirmationData = useCallback(
    (data: AppConfirmationData[]) => {
      getFilteredAppConfirmationByTimeAndPlatform(data);
      initConfirmationHistoryMap(data);
    },
    [getFilteredAppConfirmationByTimeAndPlatform, initConfirmationHistoryMap]
  );

  const updateConfirmationHistoryMap = useCallback(
    (id: string) => {
      dispatch(
        updateConfirmationHistoryData({
          ...confirmationHistoryMap,
          [id]: { lastShowTime: Date.now(), showTimes: confirmationHistoryMap[id].showTimes + 1 }
        })
      );
    },
    [confirmationHistoryMap, dispatch]
  );

  const filteredAppConfirmationMap = useMemo(() => {
    return appConfirmationData.filter((item) => {
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
  }, [appConfirmationData, checkBalanceCondition, checkEarningCondition, yieldPositionList]);

  const appConfirmationMap = useMemo(() => {
    if (filteredAppConfirmationMap) {
      const result: Record<string, AppConfirmationData[]> = filteredAppConfirmationMap.reduce((r, a) => {
        r[a.position] = r[a.position] || [];
        r[a.position].push(a);

        return r;
      }, Object.create(null));

      return result;
    } else {
      return {};
    }
  }, [filteredAppConfirmationMap]);

  return {
    setAppConfirmationData,
    updateConfirmationHistoryMap,
    appConfirmationMap
  };
};
