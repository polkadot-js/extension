// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AppBannerData } from '@subwallet/extension-base/services/mkt-campaign-service/types';
import { getAppBannerData } from '@subwallet/extension-koni-ui/messaging/campaigns';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { updateAppBannerData, updateBannerHistoryData } from '@subwallet/extension-koni-ui/stores/base/StaticContent';
import { PopupHistoryData } from '@subwallet/extension-koni-ui/types/staticContent';
import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

export interface AppBannerHookType {
  updateBannerHistoryMap: (ids: string[]) => void;
  appBannerMap: Record<string, AppBannerData[]>;
}

export const useHandleAppBannerMap = (): AppBannerHookType => {
  const dispatch = useDispatch();
  const { appBannerData, bannerHistoryMap } = useSelector((state: RootState) => state.staticContent);

  const initBannerHistoryMap = useCallback((data: AppBannerData[]) => {
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
    const result = { ...newData, ...bannerHistoryMap };

    dispatch(updateBannerHistoryData(result));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    getAppBannerData().then((rs) => {
      dispatch(updateAppBannerData(rs));
      initBannerHistoryMap(rs);
      console.log('init data success');
    }).catch((e) => console.log('error when get app banner data', e));
  }, [dispatch, initBannerHistoryMap]);

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

  const appBannerMap = useMemo(() => {
    if (appBannerData) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result: Record<string, AppBannerData[]> = appBannerData.reduce((r, a) => {
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
  }, [appBannerData]);

  console.log('appBannerMap', appBannerMap);

  return {
    updateBannerHistoryMap,
    appBannerMap
  };
};
