// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _getAssetDecimals } from '@subwallet/extension-base/services/chain-service/utils';
import { YieldPositionInfo } from '@subwallet/extension-base/types';
import { getOutputValuesFromString } from '@subwallet/extension-koni-ui/components/Field/AmountInput';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { updateAppConfirmationData, updateConfirmationHistoryData } from '@subwallet/extension-koni-ui/stores/base/StaticContent';
import { AppConfirmationData, PopupHistoryData } from '@subwallet/extension-koni-ui/types/staticContent';
import BigN from 'bignumber.js';
import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

export interface AppConfirmationHookType {
  setAppConfirmationData: (data: AppConfirmationData[]) => void;
  updateConfirmationHistoryMap: (id: string) => void;
  appConfirmationMap: Record<string, AppConfirmationData[]>;
}

export const useHandleAppConfirmationMap = (
  yieldPositionList: YieldPositionInfo[]
): AppConfirmationHookType => {
  const dispatch = useDispatch();
  const { appConfirmationData, confirmationHistoryMap } = useSelector((state: RootState) => state.staticContent);
  const { balanceMap } = useSelector((state: RootState) => state.balance);
  const { assetRegistry } = useSelector((state: RootState) => state.assetRegistry);
  const { chainInfoMap } = useSelector((state: RootState) => state.chainStore);
  const getFilteredAppConfirmationByTimeAndPlatform = useCallback(
    (data: AppConfirmationData[]) => {
      dispatch(updateAppConfirmationData(data));
    },
    [dispatch]
  );

  const initConfirmationHistoryMap = useCallback((data: AppConfirmationData[]) => {
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

  const filteredAppConfirmationMap = useMemo(() => {
    return appConfirmationData?.filter((item) => {
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
  }, [appConfirmationData, assetRegistry, balanceMap, chainInfoMap, checkComparison, yieldPositionList]);

  const appConfirmationMap = useMemo(() => {
    if (filteredAppConfirmationMap) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result: Record<string, AppConfirmationData[]> = filteredAppConfirmationMap.reduce((r, a) => {
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
  }, [filteredAppConfirmationMap]);

  return {
    setAppConfirmationData,
    updateConfirmationHistoryMap,
    appConfirmationMap
  };
};
