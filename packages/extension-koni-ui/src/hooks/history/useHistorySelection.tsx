// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountJson } from '@subwallet/extension-base/background/types';
import { useSelector } from '@subwallet/extension-koni-ui/hooks';
import { isAccountAll } from '@subwallet/extension-koni-ui/utils';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

function getSelectedAddress (accounts: AccountJson[], currentAddress: string | undefined): string {
  if (!currentAddress || !accounts.length) {
    return '';
  }

  if (!isAccountAll(currentAddress)) {
    return currentAddress;
  }

  return (accounts.find((a) => !isAccountAll(a.address)))?.address || '';
}

export default function useHistorySelection () {
  const { address: propAddress, chain: propChain } = useParams<{address: string, chain: string}>();
  const { accounts, currentAccount } = useSelector((root) => root.accountState);
  const preservedCurrentAddress = useRef<string>(currentAccount ? currentAccount.address : '');
  const [selectedAddress, setSelectedAddress] = useState<string>(propAddress || getSelectedAddress(accounts, currentAccount?.address));
  const [selectedChain, setSelectedChain] = useState<string>(propChain || 'polkadot');

  useEffect(() => {
    if (currentAccount?.address) {
      if (preservedCurrentAddress.current !== currentAccount.address) {
        preservedCurrentAddress.current = currentAccount.address;
        setSelectedAddress(getSelectedAddress(accounts, currentAccount.address));
      }
    } else {
      preservedCurrentAddress.current = '';
      setSelectedAddress('');
    }
  }, [accounts, currentAccount?.address]);

  return {
    selectedAddress,
    setSelectedAddress,
    selectedChain,
    setSelectedChain
  };
}
