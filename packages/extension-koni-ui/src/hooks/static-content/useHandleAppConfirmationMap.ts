// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AppConfirmationData } from '@subwallet/extension-base/services/mkt-campaign-service/types';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { updateConfirmationHistoryData } from '@subwallet/extension-koni-ui/stores/base/StaticContent';
import { MktCampaignHistoryData } from '@subwallet/extension-koni-ui/types/staticContent';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

export interface AppConfirmationHookType {
  updateConfirmationHistoryMap: (id: string) => void;
  appConfirmationMap: Record<string, AppConfirmationData[]>;
}

export const useHandleAppConfirmationMap = (): AppConfirmationHookType => {
  const dispatch = useDispatch();
  const { appConfirmationData, confirmationHistoryMap } = useSelector((state: RootState) => state.staticContent);
  const bannerHistoryMapRef = useRef<Record<string, MktCampaignHistoryData>>(confirmationHistoryMap);

  useEffect(() => {
    bannerHistoryMapRef.current = confirmationHistoryMap;
  }, [confirmationHistoryMap]);

  useEffect(() => {
    const newData: Record<string, MktCampaignHistoryData> = appConfirmationData && appConfirmationData.length
      ? appConfirmationData.reduce(
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
    const result: Record<string, MktCampaignHistoryData> = {};

    Object.keys(newData).forEach((key) => {
      if (!bannerHistoryMapRef.current[key]) {
        result[key] = newData[key];
      } else {
        result[key] = bannerHistoryMapRef.current[key];
      }
    });

    dispatch(updateConfirmationHistoryData(result));
  }, [appConfirmationData, dispatch]);

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

  const appConfirmationMap = useMemo(() => {
    if (appConfirmationData) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result: Record<string, AppConfirmationData[]> = appConfirmationData.reduce((r, a) => {
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
  }, [appConfirmationData]);

  return {
    updateConfirmationHistoryMap,
    appConfirmationMap
  };
};
