// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AppPopupData } from '@subwallet/extension-base/services/mkt-campaign-service/types';
import { getAppPopupData } from '@subwallet/extension-koni-ui/messaging/campaigns';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { updateAppPopupData, updatePopupHistoryData } from '@subwallet/extension-koni-ui/stores/base/StaticContent';
import { PopupHistoryData } from '@subwallet/extension-koni-ui/types/staticContent';
import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

export interface AppPopupHookType {
  updatePopupHistoryMap: (id: string) => void;
  appPopupMap: Record<string, AppPopupData[]>;
}

export const useHandleAppPopupMap = (): AppPopupHookType => {
  const { appPopupData, popupHistoryMap } = useSelector((state: RootState) => state.staticContent);
  const dispatch = useDispatch();

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

  useEffect(() => {
    getAppPopupData().then((rs) => {
      dispatch(updateAppPopupData(rs));
      initPopupHistoryMap(rs);
      console.log('init data success');
    }).catch((e) => console.log('error when get app popup data', e));
  }, [dispatch, initPopupHistoryMap]);

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

  const appPopupMap = useMemo(() => {
    if (appPopupData) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result: Record<string, AppPopupData[]> = appPopupData.reduce((r, a) => {
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
  }, [appPopupData]);

  return {
    updatePopupHistoryMap,
    appPopupMap
  };
};
