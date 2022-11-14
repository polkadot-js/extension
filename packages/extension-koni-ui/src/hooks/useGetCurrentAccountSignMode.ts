// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SIGN_MODE } from '@subwallet/extension-koni-ui/constants/signing';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { getSignMode } from '@subwallet/extension-koni-ui/util/account';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

const useGetCurrentAccountSignMode = (): SIGN_MODE => {
  const account = useSelector((state: RootState) => state.currentAccount.account);

  return useMemo((): SIGN_MODE => {
    return getSignMode(account);
  }, [account]);
};

export default useGetCurrentAccountSignMode;
