// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AuthUrlInfo } from '@subwallet/extension-base/background/handlers/State';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { useGetCurrentTabUrl } from './useGetCurrentTabUrl';

export const useGetCurrentAuth = () => {
  const currentUrl = useGetCurrentTabUrl();

  const { authUrl } = useSelector((state: RootState) => state);

  return useMemo((): AuthUrlInfo | undefined => {
    let rs: AuthUrlInfo | undefined;

    if (currentUrl) {
      for (const auth of Object.values(authUrl)) {
        if (currentUrl.includes(auth.id)) {
          rs = auth;
          break;
        }
      }
    }

    return rs;
  }, [currentUrl, authUrl]);
};
