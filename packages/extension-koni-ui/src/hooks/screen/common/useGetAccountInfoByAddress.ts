// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountJson } from '@subwallet/extension-base/background/types';
import { reformatAddress } from '@subwallet/extension-base/utils';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { useSelector } from 'react-redux';

import { isEthereumAddress } from '@polkadot/util-crypto';

export default function useGetAccountInfoByAddress (address: string): AccountJson | undefined {
  const accountInfoList = useSelector((state: RootState) => state.accountState.accounts);
  let result: AccountJson | undefined;

  for (const accountInfo of accountInfoList) {
    const isAddressEvm = isEthereumAddress(address);

    if (reformatAddress(accountInfo.address, 42, isAddressEvm) === reformatAddress(address, 42, isAddressEvm)) {
      result = accountInfo;
      break;
    }
  }

  return result;
}
