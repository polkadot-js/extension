// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SIGN_MODE } from '@subwallet/extension-koni-ui/constants/signing';
import useGetAccountByAddress from '@subwallet/extension-koni-ui/hooks/useGetAccountByAddress';
import { useGetSignMode } from '@subwallet/extension-koni-ui/hooks/useGetSignMode';
import { useMemo } from 'react';

const useNeedMigratePassword = (address?: string): boolean => {
  const account = useGetAccountByAddress(address);
  const signMode = useGetSignMode(account);

  return useMemo(() => signMode === SIGN_MODE.PASSWORD && !account?.isMasterPassword, [account?.isMasterPassword, signMode]);
};

export default useNeedMigratePassword;
