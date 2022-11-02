// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountJson } from '@subwallet/extension-base/background/types';
import { AccountContext } from '@subwallet/extension-koni-ui/contexts';
import { findAccountByAddress } from '@subwallet/extension-koni-ui/util/account';
import { useContext, useMemo } from 'react';

const useGetAccountByAddress = (address?: string): AccountJson | null => {
  const { accounts } = useContext(AccountContext);

  return useMemo((): AccountJson | null => {
    return findAccountByAddress(accounts, address);
  }, [accounts, address]);
};

export default useGetAccountByAddress;
