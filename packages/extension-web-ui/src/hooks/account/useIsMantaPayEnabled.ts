// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { MantaPayConfig } from '@subwallet/extension-base/background/KoniTypes';
import { RootState } from '@subwallet/extension-web-ui/stores';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

function checkExistMantaSetting (configs: MantaPayConfig[], address: string) {
  for (const config of configs) {
    if (config.address === address && config.enabled) {
      return true;
    }
  }

  return false;
}

export const useIsMantaPayEnabled = (address?: string) => {
  const configs = useSelector((state: RootState) => state.mantaPay.configs);
  const { currentAccount, isAllAccount } = useSelector((state: RootState) => state.accountState);

  return useMemo((): boolean => {
    if (!address) {
      if (isAllAccount) {
        return false;
      } else {
        return checkExistMantaSetting(configs, currentAccount?.address as string);
      }
    } else {
      return checkExistMantaSetting(configs, address);
    }
  }, [address, configs, currentAccount?.address, isAllAccount]);
};
