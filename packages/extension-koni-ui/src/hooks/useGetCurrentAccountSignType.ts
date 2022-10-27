// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RootState } from '@subwallet/extension-koni-ui/stores';
import { AccountSignType } from '@subwallet/extension-koni-ui/types/account';
import { getAccountType } from '@subwallet/extension-koni-ui/util/account';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

const useGetCurrentAccountSignType = (): AccountSignType => {
  const account = useSelector((state: RootState) => state.currentAccount.account);

  return useMemo((): AccountSignType => {
    return getAccountType(account);
  }, [account]);
};

export default useGetCurrentAccountSignType;
