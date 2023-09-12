// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountJson } from '@subwallet/extension-base/background/types';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { isEthereumAddress } from '@polkadot/util-crypto';

export const useIsMantaPayAvailable = (account: AccountJson | null) => {
  const configs = useSelector((state: RootState) => state.mantaPay.configs);

  const isAvailableForAccount = useMemo(() => {
    return !!account &&
      configs.length === 0 &&
      !account.isExternal &&
      !!account.isMasterAccount &&
      !account.isReadOnly &&
      !account.isInjected &&
      !isEthereumAddress(account.address);
  }, [account, configs.length]);

  const isEnabledForAccount = useMemo(() => {
    if (!account) {
      return false;
    }

    for (const config of configs) {
      if (config.address === account.address) {
        return true;
      }
    }

    return false;
  }, [account, configs]);

  return !account ? false : (isEnabledForAccount || (!isEnabledForAccount && isAvailableForAccount));
};
