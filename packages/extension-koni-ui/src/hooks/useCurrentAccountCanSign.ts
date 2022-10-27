// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import useGetCurrentAccountType from '@subwallet/extension-koni-ui/hooks/useGetCurrentAccountType';
import { accountCanSign } from '@subwallet/extension-koni-ui/util/account';
import { useMemo } from 'react';

const useCurrentAccountCanSign = () => {
  const accountType = useGetCurrentAccountType();

  return useMemo((): boolean => {
    return accountCanSign(accountType);
  }, [accountType]);
};

export default useCurrentAccountCanSign;
