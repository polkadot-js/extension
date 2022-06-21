// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RootState } from '@subwallet/extension-koni-ui/stores';
import { isAccountAll } from '@subwallet/extension-koni-ui/util';
import { useSelector } from 'react-redux';

export default function useIsAccountAll () {
  const { currentAccount: { account } } = useSelector((state: RootState) => state);

  if (!account) {
    return false;
  } else {
    return isAccountAll(account.address);
  }
}
