// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from 'react';

import { useSelector } from '../common';

const useGetBannerByScreen = (screen: string) => {
  const { banners } = useSelector((state) => state.campaign);

  return useMemo(() => {
    return banners.filter((item) => item.data.position.includes(screen));
  }, [banners, screen]);
};

export default useGetBannerByScreen;
