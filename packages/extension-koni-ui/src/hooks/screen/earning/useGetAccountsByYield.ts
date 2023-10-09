// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BaseAccountInfo } from '@subwallet/extension-koni-ui/components/Account/Info/AvatarGroup';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { findAccountByAddress } from '@subwallet/extension-koni-ui/utils';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

export default function useGetAccountsByYield (slug: string): BaseAccountInfo[] {
  const { yieldPosition } = useSelector((state: RootState) => state.yieldPool);
  const { accounts } = useSelector((state: RootState) => state.accountState);

  return useMemo(() => {
    const accountInfos: BaseAccountInfo[] = [];

    yieldPosition.forEach((positionInfo) => {
      if (positionInfo.slug === slug) {
        accountInfos.push({ address: positionInfo.address });
      }
    });

    accountInfos.forEach((accountInfo) => {
      const accountJson = findAccountByAddress(accounts, accountInfo.address);

      if (accountJson) {
        accountInfo.name = accountJson.name;
        accountInfo.type = accountJson.type;
      }
    });

    return accountInfos;
  }, [accounts, slug, yieldPosition]);
}
