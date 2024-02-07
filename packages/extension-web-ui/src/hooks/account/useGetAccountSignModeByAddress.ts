// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import useGetAccountByAddress from '@subwallet/extension-web-ui/hooks/account/useGetAccountByAddress';
import { AccountSignMode } from '@subwallet/extension-web-ui/types/account';
import { getSignMode } from '@subwallet/extension-web-ui/utils/account/account';
import { useMemo } from 'react';

const useGetAccountSignModeByAddress = (address?: string): AccountSignMode => {
  const account = useGetAccountByAddress(address);

  return useMemo((): AccountSignMode => {
    return getSignMode(account);
  }, [account]);
};

export default useGetAccountSignModeByAddress;
