// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import useGetAccountByAddress from '@subwallet/extension-koni-ui/hooks/useGetAccountByAddress';
import { AccountSignType } from '@subwallet/extension-koni-ui/types/account';
import { getAccountType } from '@subwallet/extension-koni-ui/util/account';
import { useMemo } from 'react';

const useGetAccountSignTypeByAddress = (address: string): AccountSignType => {
  const account = useGetAccountByAddress(address);

  return useMemo((): AccountSignType => {
    return getAccountType(account);
  }, [account]);
};

export default useGetAccountSignTypeByAddress;
