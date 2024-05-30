// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AllowedPath } from '@subwallet/extension-base/background/types';
import { _getAssetDecimals } from '@subwallet/extension-base/services/chain-service/utils';
import { YieldPositionInfo } from '@subwallet/extension-base/types';
import { getOutputValuesFromString } from '@subwallet/extension-koni-ui/components/Field/AmountInput';
import { AppPopupModalContext, AppPopupModalInfo } from '@subwallet/extension-koni-ui/contexts/AppPopupModalContext';
import { useGroupYieldPosition } from '@subwallet/extension-koni-ui/hooks';
import { useGetAppInstructionData } from '@subwallet/extension-koni-ui/hooks/static-content/useGetAppInstructionData';
import { useHandleAppBannerMap } from '@subwallet/extension-koni-ui/hooks/static-content/useHandleAppBannerMap';
import { useHandleAppConfirmationMap } from '@subwallet/extension-koni-ui/hooks/static-content/useHandleAppConfirmationMap';
import { useHandleAppPopupMap } from '@subwallet/extension-koni-ui/hooks/static-content/useHandleAppPopupMap';
import { windowOpen } from '@subwallet/extension-koni-ui/messaging';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { AppBannerData, AppBasicInfoData, AppConfirmationData, AppPopupData, ConditionBalanceType, ConditionEarningType, OnlineContentDataType, PopupFrequency, PopupHistoryData } from '@subwallet/extension-koni-ui/types/staticContent';
import { openInNewTab } from '@subwallet/extension-koni-ui/utils';
import axios from 'axios';
import BigN from 'bignumber.js';
import React, { useCallback, useContext, useEffect } from 'react';
import { useSelector } from 'react-redux';

interface AppOnlineContentContextProviderProps {
  children?: React.ReactElement;
}

interface AppOnlineContentContextType {
  appPopupMap: Record<string, AppPopupData[]>;
  appBannerMap: Record<string, AppBannerData[]>;
  appConfirmationMap: Record<string, AppConfirmationData[]>;
  popupHistoryMap: Record<string, PopupHistoryData>;
  bannerHistoryMap: Record<string, PopupHistoryData>;
  confirmationHistoryMap: Record<string, PopupHistoryData>;
  updatePopupHistoryMap: (id: string) => void;
  updateBannerHistoryMap: (ids: string[]) => void;
  updateConfirmationHistoryMap: (id: string) => void;
  checkPopupExistTime: (info: AppBasicInfoData) => boolean;
  checkPopupVisibleByFrequency: (
    repeat: PopupFrequency,
    lastShowTime: number,
    showTimes: number,
    customizeRepeatTime: number | null,
  ) => boolean;
  handleButtonClick: (id: string) => (type: OnlineContentDataType, url?: string) => void;
  checkBannerVisible: (showTimes: number) => boolean;
  checkPositionParam: (screen: string, positionParams: { property: string; value: string }[], value: string) => boolean;
  showAppPopup: (currentRoute: string | undefined) => void;
}

const TIME_MILLI = {
  DAY: 86400,
  WEEK: 604800,
  MONTH: 2592000
};

export const AppOnlineContentContext = React.createContext({} as AppOnlineContentContextType);

const getPositionByRouteName = (currentRoute?: string) => {
  if (!currentRoute) {
    return '';
  }

  switch (currentRoute) {
    case '/home/nfts/collections':
      return 'nft';
    case '/home/earning':
      return 'earning';
    case '/home/crowdloans':
      return 'crowdloan';
    case '/':
    default:
      return 'token';
  }
};

const getAllowedPathByPosition = (position?: string) => {
  if (!position) {
    return '';
  }

  switch (position) {
    case 'collections':
      return '/home/nfts/collections';
    case 'earning':
      return '/home/earning';
    case 'crowdloans':
      return '/home/crowdloans';
    case '/':
    default:
      return '/home/tokens';
  }
};

export const AppOnlineContentContextProvider = ({ children }: AppOnlineContentContextProviderProps) => {
  const appPopupModalContext = useContext(AppPopupModalContext);
  const { assetRegistry } = useSelector((state: RootState) => state.assetRegistry);
  const { balanceMap } = useSelector((state: RootState) => state.balance);
  const { chainInfoMap } = useSelector((state: RootState) => state.chainStore);
  const yieldPositionList = useGroupYieldPosition();
  const language = useSelector((state: RootState) => state.settings.language);
  const { getAppInstructionData } = useGetAppInstructionData(language);

  const { appBannerData,
    appConfirmationData,
    appPopupData,
    bannerHistoryMap,
    confirmationHistoryMap,
    popupHistoryMap } = useSelector((state: RootState) => state.staticContent);

  const getAppContentData = useCallback(async (dataType: OnlineContentDataType) => {
    return await axios.get(`https://content.subwallet.app/api/list/app-${dataType}?preview=true`);
  }, []);

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

  // check popup exist time
  const checkPopupExistTime = useCallback((info: AppBasicInfoData) => {
    if (info.start_time && info.stop_time) {
      const now = new Date();
      const startTime = new Date(info.start_time);
      const endTime = new Date(info.stop_time);

      if (now >= startTime && now <= endTime) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }, []);

  // check popup frequency
  const checkPopupVisibleByFrequency = useCallback(
    (repeat: PopupFrequency, lastShowTime: number, showTimes: number, customizeRepeatTime: number | null) => {
      if (customizeRepeatTime) {
        return Date.now() - lastShowTime > customizeRepeatTime * 86400000;
      } else {
        if (repeat) {
          switch (repeat) {
            case 'once':
              return showTimes < 1;
            case 'daily':
              return Date.now() - lastShowTime > TIME_MILLI.DAY;
            case 'weekly':
              return Date.now() - lastShowTime > TIME_MILLI.WEEK;
            case 'monthly':
              return Date.now() - lastShowTime > TIME_MILLI.MONTH;
            case 'every_time':
              return true;
          }
        } else {
          return Date.now() - lastShowTime > TIME_MILLI.DAY;
        }
      }
    },
    []
  );

  // check banner hidden
  const checkBannerVisible = useCallback((showTimes: number) => {
    return showTimes === 0;
  }, []);

  const checkPositionParam = useCallback(
    (screen: string, positionParams: { property: string; value: string }[], value: string) => {
      if (positionParams && positionParams.length) {
        if (screen === 'token_detail') {
          const allowTokenSlugs = positionParams
            .filter((item) => item.property === 'tokenSlug')
            .map((param) => param.value);

          return allowTokenSlugs.some((slug) => value.toLowerCase().includes(slug.toLowerCase()));
        } else if (screen === 'earning') {
          const allowPoolSlugs = positionParams.filter((item) => item.property === 'poolSlug').map((param) => param.value);

          return allowPoolSlugs.some((slug) => value.toLowerCase().includes(slug.toLowerCase()));
        } else {
          return true;
        }
      } else {
        return true;
      }
    },
    []
  );

  const checkBalanceCondition = useCallback(
    (conditionBalance: ConditionBalanceType[]) => {
      const conditionBalanceList = conditionBalance.map((item) => {
        return Object.values(balanceMap).some((info) => {
          const balanceData = info[item.chain_asset];
          const decimals = _getAssetDecimals(assetRegistry[item.chain_asset]);
          const freeBalance = balanceData?.free;
          const lockedBalance = balanceData?.locked;
          const value = new BigN(freeBalance).plus(lockedBalance).toString();
          const comparisonValue = getOutputValuesFromString(item.value.toString(), decimals);

          return checkComparison(item.comparison, value, comparisonValue);
        });
      });

      return conditionBalanceList.some((item) => item);
    },
    [assetRegistry, balanceMap, checkComparison]
  );

  const checkEarningCondition = useCallback(
    (_yieldPositionList: YieldPositionInfo[], conditionEarning: ConditionEarningType[]) => {
      const conditionEarningList = conditionEarning.map((condition) => {
        const yieldPosition = _yieldPositionList.find((item) => item.slug === condition.pool_slug);

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

      return conditionEarningList.some((item) => item);
    },
    [chainInfoMap, checkComparison]
  );

  const { appPopupMap, setAppPopupData, updatePopupHistoryMap } = useHandleAppPopupMap(
    appPopupData,
    popupHistoryMap,
    yieldPositionList,
    checkPopupExistTime,
    checkBalanceCondition,
    checkEarningCondition
  );
  const { appBannerMap, setAppBannerData, updateBannerHistoryMap } = useHandleAppBannerMap(
    appBannerData,
    bannerHistoryMap,
    yieldPositionList,
    checkPopupExistTime,
    checkBalanceCondition,
    checkEarningCondition
  );
  const { appConfirmationMap, setAppConfirmationData, updateConfirmationHistoryMap } = useHandleAppConfirmationMap(
    appConfirmationData,
    confirmationHistoryMap,
    yieldPositionList,
    checkBalanceCondition,
    checkEarningCondition
  );

  useEffect(() => {
    getAppInstructionData();
  }, [getAppInstructionData]);

  useEffect(() => {
    const popupPromise = getAppContentData('popup');
    const bannerPromise = getAppContentData('banner');
    const confirmationPromise = getAppContentData('confirmation');

    Promise.all([popupPromise, bannerPromise, confirmationPromise])
      .then((values) => {
        setAppPopupData(values[0].data as AppPopupData[]);
        setAppBannerData(values[1].data as AppBannerData[]);
        setAppConfirmationData(values[2].data as AppConfirmationData[]);
      })
      .catch((e) => {
        console.error(e);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleButtonClick = useCallback(
    (id: string) => {
      return (type: OnlineContentDataType, url?: string) => {
        if (type === 'popup') {
          updatePopupHistoryMap(id);
        } else if (type === 'confirmation') {
          updateConfirmationHistoryMap(id);
        }

        if (url) {
          if (url.startsWith('subwallet://')) {
            const parts = url.split('/');
            const target = parts[parts.length - 1];
            const allowedPath = getAllowedPathByPosition(target);

            windowOpen({ allowedPath: allowedPath as AllowedPath }).catch((e) => console.error(e));
          } else {
            openInNewTab(url)();
          }
        }
      };
    },
    [updateConfirmationHistoryMap, updatePopupHistoryMap]
  );

  const showAppPopup = useCallback(
    (currentRoute: string | undefined) => {
      const currentTransformRoute = getPositionByRouteName(currentRoute) || '';
      const currentPopupList = appPopupMap[currentTransformRoute];

      if (currentPopupList && currentPopupList.length) {
        const filteredPopupList = currentPopupList.filter((item) => {
          const popupHistory = popupHistoryMap[`${item.position}-${item.id}`];

          if (popupHistory) {
            return checkPopupVisibleByFrequency(
              item.repeat,
              popupHistory.lastShowTime,
              popupHistory.showTimes,
              item.repeat_every_x_days
            );
          } else {
            return false;
          }
        });

        if (filteredPopupList && filteredPopupList.length) {
          const result: AppPopupModalInfo[] = filteredPopupList.map((item) => ({
            type: 'popup',
            repeat: item.repeat,
            title: item.info.name,
            message: item.content || '',
            buttons: item.buttons,
            onPressBtn: (url?: string) => {
              handleButtonClick(`${item.position}-${item.id}`)('popup', url);
            }
          }));

          appPopupModalContext.setData(result);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [appPopupMap, checkPopupVisibleByFrequency, handleButtonClick, popupHistoryMap]
  );

  return (
    <AppOnlineContentContext.Provider
      value={{
        appPopupMap,
        appBannerMap,
        appConfirmationMap,
        popupHistoryMap,
        bannerHistoryMap,
        confirmationHistoryMap,
        updatePopupHistoryMap,
        updateBannerHistoryMap,
        updateConfirmationHistoryMap,
        checkPopupExistTime,
        checkPopupVisibleByFrequency,
        handleButtonClick,
        checkBannerVisible,
        checkPositionParam,
        showAppPopup
      }}
    >
      {children}
    </AppOnlineContentContext.Provider>
  );
};
