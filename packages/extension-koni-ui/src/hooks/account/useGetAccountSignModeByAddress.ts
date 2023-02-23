// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SIGN_MODE } from '@subwallet/extension-koni-ui/constants/signing';
import useGetAccountByAddress from '@subwallet/extension-koni-ui/hooks/account/useGetAccountByAddress';
import { getSignMode } from '@subwallet/extension-koni-ui/util/account';
import { useMemo } from 'react';

const useGetAccountSignModeByAddress = (address?: string): SIGN_MODE => {
  const account = useGetAccountByAddress(address);

  return useMemo((): SIGN_MODE => {
    return getSignMode(account);
  }, [account]);
};

export default useGetAccountSignModeByAddress;
