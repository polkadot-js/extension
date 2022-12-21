// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountContext } from '@subwallet/extension-koni-ui/contexts';
import { useContext, useMemo } from 'react';

const useGetNewAccountDefaultName = (): string => {
  const { accounts } = useContext(AccountContext);

  return useMemo(() => {
    const accountsWithoutAll = accounts.filter((acc: { address: string; }) => acc.address !== 'ALL');

    return `Account ${accountsWithoutAll.length + 1}`;
  }, [accounts]);
};

export default useGetNewAccountDefaultName;
