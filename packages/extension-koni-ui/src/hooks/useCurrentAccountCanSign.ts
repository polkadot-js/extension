// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import useGetCurrentAccountSignType from '@subwallet/extension-koni-ui/hooks/useGetCurrentAccountSignType';
import { accountCanSign } from '@subwallet/extension-koni-ui/util/account';
import { useMemo } from 'react';

const useCurrentAccountCanSign = () => {
  const accountSignType = useGetCurrentAccountSignType();

  return useMemo((): boolean => {
    return accountCanSign(accountSignType);
  }, [accountSignType]);
};

export default useCurrentAccountCanSign;
