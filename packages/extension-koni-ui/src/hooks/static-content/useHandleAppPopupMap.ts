// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _getAssetDecimals } from '@subwallet/extension-base/services/chain-service/utils';
import { YieldPositionInfo } from '@subwallet/extension-base/types';
import { getOutputValuesFromString } from '@subwallet/extension-koni-ui/components/Field/AmountInput';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { updateAppPopupData, updatePopupHistoryData } from '@subwallet/extension-koni-ui/stores/base/StaticContent';
import { AppBasicInfoData, AppPopupData, PopupHistoryData } from '@subwallet/extension-koni-ui/types/staticContent';
import BigN from 'bignumber.js';
import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

export interface AppPopupHookType {
  setAppPopupData: (data: AppPopupData[]) => void;
  updatePopupHistoryMap: (id: string) => void;
  appPopupMap: Record<string, AppPopupData[]>;
}

export const useHandleAppPopupMap = (
  yieldPositionList: YieldPositionInfo[],
  checkPopupExistTime: (info: AppBasicInfoData) => boolean
): AppPopupHookType => {
  const { appPopupData, popupHistoryMap } = useSelector((state: RootState) => state.staticContent);

  const dispatch = useDispatch();
  const { assetRegistry } = useSelector((state: RootState) => state.assetRegistry);
  const { balanceMap } = useSelector((state: RootState) => state.balance);
  const { chainInfoMap } = useSelector((state: RootState) => state.chainStore);
  const getFilteredAppPopupByTimeAndPlatform = useCallback(
    (data: AppPopupData[]) => {
      const activeList = data && data.length ? data.filter(({ info }) => checkPopupExistTime(info)) : [];
      const filteredData = activeList && activeList.length
        ? activeList.filter(({ info }) => info.platforms.includes('extension'))
          .sort((a, b) => a.priority - b.priority)
        : [];

      dispatch(updateAppPopupData(filteredData));
    },
    [checkPopupExistTime, dispatch]
  );

  const initPopupHistoryMap = useCallback((data: AppPopupData[]) => {
    const newData: Record<string, PopupHistoryData> = data && data.length
      ? data.reduce(
        (o, key) =>
          Object.assign(o, {
            [`${key.position}-${key.id}`]: {
              lastShowTime: 0,
              showTimes: 0
            }
          }),
        {}
      )
      : {};
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

  const checkComparison = useCallback((comparison: string, value: string, comparisonValue: string) => {
    switch (comparison) {
      case 'eq':
        return new BigN(value).eq(comparisonValue);
      case 'gt':
        return new BigN(value).gt(comparisonValue);
      case 'gte':
        return new BigN(value).gte(comparisonValue);
      case 'lt':
        return new BigN(value).lt(comparisonValue);
      case 'lte':
        return new BigN(value).lte(comparisonValue);
      default:
        return true;
    }
  }, []);

  const filteredAppPopupMap = useMemo(() => {
    return appPopupData?.filter((item) => {
      if (!!Object.keys(item.conditions) && !!Object.keys(item.conditions).length) {
        const isPassValidation: boolean[] = [];

        if (item.conditions['condition-balance'] && item.conditions['condition-balance'].length) {
          const dataFilterByBalanceCondition = item.conditions['condition-balance'].map((_item) => {
            return Object.values(balanceMap).some((info) => {
              const balanceData = info[_item.chain_asset];
              const decimals = _getAssetDecimals(assetRegistry[_item.chain_asset]);
              const freeBalance = balanceData?.free;
              const lockedBalance = balanceData?.locked;
              const value = new BigN(freeBalance).plus(lockedBalance).toString();
              const comparisonValue = getOutputValuesFromString(_item.value.toString(), decimals);

              return checkComparison(_item.comparison, value, comparisonValue);
            });
          });

          isPassValidation.push(dataFilterByBalanceCondition.some((item) => item));
        }

        if (item.conditions['condition-earning'] && item.conditions['condition-earning'].length) {
          const dataFilterByEarningCondition = item.conditions['condition-earning'].map((condition) => {
            const yieldPosition = yieldPositionList.find((_item) => _item.slug === condition.pool_slug);

            if (yieldPosition) {
              const chainInfo = chainInfoMap[yieldPosition.chain];
              const decimals = chainInfo?.substrateInfo?.decimals || chainInfo?.evmInfo?.decimals;
              const activeStake = yieldPosition.totalStake;
              const comparisonValue = getOutputValuesFromString(condition.value.toString(), decimals || 0);

              return checkComparison(condition.comparison, activeStake, comparisonValue);
            } else {
              return false;
            }
          });

          isPassValidation.push(dataFilterByEarningCondition.some((item) => item));
        }

        if (isPassValidation && isPassValidation.length) {
          return isPassValidation.some((item) => item);
        } else {
          return true;
        }
      } else {
        return true;
      }
    });
  }, [appPopupData, assetRegistry, balanceMap, chainInfoMap, checkComparison, yieldPositionList]);

  const appPopupMap = useMemo(() => {
    if (filteredAppPopupMap) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result: Record<string, AppPopupData[]> = filteredAppPopupMap.reduce((r, a) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
        r[a.position] = r[a.position] || [];
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        r[a.position].push(a);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
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
