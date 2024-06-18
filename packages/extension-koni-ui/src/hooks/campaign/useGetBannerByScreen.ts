// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AppOnlineContentContext } from '@subwallet/extension-koni-ui/contexts/AppOnlineContentProvider';
import { useCallback, useContext, useMemo } from 'react';

const useGetBannerByScreen = (screen: string, compareValue?: string) => {
  const { appBannerMap,
    bannerHistoryMap,
    checkBannerVisible,
    checkPopupExistTime,
    checkPositionParam,
    handleButtonClick,
    updateBannerHistoryMap } = useContext(AppOnlineContentContext);

  const dismissBanner = useCallback(
    (ids: string[]) => {
      updateBannerHistoryMap(ids);
    },
    [updateBannerHistoryMap]
  );

  const onClickBanner = useCallback(
    (id: string) => {
      return (url?: string) => {
        url && handleButtonClick(id)('banner', url);
      };
    },
    [handleButtonClick]
  );

  const banners = useMemo(() => {
    const displayedBanner = appBannerMap[screen];

    if (displayedBanner && displayedBanner.length) {
      return displayedBanner.filter((banner) => {
        const bannerHistory = bannerHistoryMap[`${banner.position}-${banner.id}`];
        const isBannerVisible = checkBannerVisible(bannerHistory?.showTimes) && checkPopupExistTime(banner.info);

        if (compareValue) {
          return checkPositionParam(screen, banner.position_params, compareValue) && isBannerVisible;
        } else {
          return isBannerVisible;
        }
      });
    } else {
      return [];
    }
  }, [
    appBannerMap,
    screen,
    bannerHistoryMap,
    checkBannerVisible,
    checkPopupExistTime,
    compareValue,
    checkPositionParam
  ]);

  return { banners, dismissBanner, onClickBanner };
};

export default useGetBannerByScreen;
