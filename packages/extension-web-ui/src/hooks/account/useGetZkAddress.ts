// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RootState } from '@subwallet/extension-web-ui/stores';
import { useSelector } from 'react-redux';

export const useGetZkAddress = (address?: string) => {
  const configs = useSelector((state: RootState) => state.mantaPay.configs);

  if (!address) {
    return;
  }

  for (const config of configs) {
    if (config.address === address) {
      return config.zkAddress;
    }
  }

  return undefined;
};
