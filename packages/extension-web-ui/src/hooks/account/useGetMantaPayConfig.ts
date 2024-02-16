// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { MantaPayConfig } from '@subwallet/extension-base/background/KoniTypes';
import { RootState } from '@subwallet/extension-web-ui/stores';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

export const useGetMantaPayConfig = (address?: string) => {
  const configs = useSelector((state: RootState) => state.mantaPay.configs);

  return useMemo((): MantaPayConfig | undefined => {
    if (!address) {
      return undefined;
    } else {
      for (const config of configs) {
        if (config.address === address) {
          return config;
        }
      }

      return undefined;
    }
  }, [address, configs]);
};
