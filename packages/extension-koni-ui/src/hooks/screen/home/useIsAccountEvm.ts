// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RootState } from '@subwallet/extension-koni-ui/stores';
import { useSelector } from 'react-redux';

import { isEthereumAddress } from '@polkadot/util-crypto';

export default function useIsAccountEvm () {
  const { currentAccount: { account } } = useSelector((state: RootState) => state);

  if (!account) {
    return false;
  } else {
    return isEthereumAddress(account.address);
  }
}
