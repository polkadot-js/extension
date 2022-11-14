// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import useGetCurrentAccountSignMode from '@subwallet/extension-koni-ui/hooks/useGetCurrentAccountSignMode';
import { accountCanSign } from '@subwallet/extension-koni-ui/util/account';
import { useMemo } from 'react';

const useCurrentAccountCanSign = () => {
  const accountSignType = useGetCurrentAccountSignMode();

  return useMemo((): boolean => {
    return accountCanSign(accountSignType);
  }, [accountSignType]);
};

export default useCurrentAccountCanSign;
