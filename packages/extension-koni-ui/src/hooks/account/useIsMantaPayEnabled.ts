// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RootState } from '@subwallet/extension-koni-ui/stores';
import { useSelector } from 'react-redux';

export const useIsMantaPayEnabled = (address: string) => {
  const configs = useSelector((state: RootState) => state.mantaPay.configs);

  for (const config of configs) {
    if (config.address === address) {
      return true;
    }
  }

  return false;
};
