// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import useGetAccountByAddress from '@subwallet/extension-koni-ui/hooks/useGetAccountByAddress';
import { AccountType } from '@subwallet/extension-koni-ui/types/account';
import { getAccountType } from '@subwallet/extension-koni-ui/util/account';
import { useMemo } from 'react';

const useGetAccountTypeByAddress = (address: string): AccountType => {
  const account = useGetAccountByAddress(address);

  return useMemo((): AccountType => {
    return getAccountType(account);
  }, [account]);
};

export default useGetAccountTypeByAddress;
