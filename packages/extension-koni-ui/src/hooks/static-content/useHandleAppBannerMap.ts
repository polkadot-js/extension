// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AppBannerData } from '@subwallet/extension-base/services/mkt-campaign-service/types';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { updateBannerHistoryData } from '@subwallet/extension-koni-ui/stores/base/StaticContent';
import { MktCampaignHistoryData } from '@subwallet/extension-koni-ui/types/staticContent';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

export interface AppBannerHookType {
  updateBannerHistoryMap: (ids: string[]) => void;
  appBannerMap: Record<string, AppBannerData[]>;
}

export const useHandleAppBannerMap = (): AppBannerHookType => {
  const dispatch = useDispatch();
  const { appBannerData, bannerHistoryMap } = useSelector((state: RootState) => state.staticContent);
  const bannerHistoryMapRef = useRef<Record<string, MktCampaignHistoryData>>(bannerHistoryMap);

  useEffect(() => {
    bannerHistoryMapRef.current = bannerHistoryMap;
  }, [bannerHistoryMap]);

  useEffect(() => {
    const newData: Record<string, MktCampaignHistoryData> = appBannerData && appBannerData.length
      ? appBannerData.reduce(
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
    const result: Record<string, MktCampaignHistoryData> = { ...newData, ...bannerHistoryMapRef.current };

    dispatch(updateBannerHistoryData(result));
  }, [appBannerData, dispatch]);

  const updateBannerHistoryMap = useCallback(
    (ids: string[]) => {
      const result: Record<string, MktCampaignHistoryData> = {};

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

  return {
    updateBannerHistoryMap,
    appBannerMap
  };
};
