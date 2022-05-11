// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useContext, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { AccountContext } from '@subwallet/extension-koni-ui/components';
import useGenesisHashOptions from '@subwallet/extension-koni-ui/hooks/useGenesisHashOptions';
import { tieAccount } from '@subwallet/extension-koni-ui/messaging';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { updateCurrentNetwork } from '@subwallet/extension-koni-ui/stores/updater';
import { getGenesisOptionsByAddressType, isAccountAll } from '@subwallet/extension-koni-ui/util';

function Rendering (): React.ReactElement {
  const { accounts } = useContext(AccountContext);
  const { currentAccount: { account } } = useSelector((state: RootState) => state);

  const genesisOptions = getGenesisOptionsByAddressType(account?.address, accounts, useGenesisHashOptions());
  const _isAccountAll = account && isAccountAll(account.address);

  useEffect(() => {
    let isSync = true;

    if (_isAccountAll) {
      let networkSelected;
      // console.log('genesisOption', genesisOptions);
      const accountAllNetworkGenesisHash = window.localStorage.getItem('accountAllNetworkGenesisHash');

      if (!accountAllNetworkGenesisHash) {
        networkSelected = genesisOptions[0];
      } else {
        networkSelected = genesisOptions.find((opt) => opt.value === accountAllNetworkGenesisHash);

        if (!networkSelected) {
          window.localStorage.setItem('accountAllNetworkGenesisHash', '');
          networkSelected = genesisOptions[0];
        }
      }

      if (networkSelected) {
        // console.log('networkSelected')
        updateCurrentNetwork({
          networkPrefix: networkSelected.networkPrefix,
          icon: networkSelected.icon,
          genesisHash: networkSelected.value,
          networkKey: networkSelected.networkKey,
          isEthereum: networkSelected.isEthereum
        });
      }

      return;
    }

    (async () => {
      let networkSelected;

      if (!account || !account?.genesisHash) {
        networkSelected = genesisOptions[0];
      } else {
        networkSelected = genesisOptions.find((opt) => opt.value === account.genesisHash);

        if (!networkSelected) {
          await tieAccount(account.address, null);
          networkSelected = genesisOptions[0];
        }
      }

      if (isSync && networkSelected) {
        updateCurrentNetwork({
          networkPrefix: networkSelected.networkPrefix,
          icon: networkSelected.icon,
          genesisHash: networkSelected.value,
          networkKey: networkSelected.networkKey,
          isEthereum: networkSelected.isEthereum
        });
      }
    })().catch((e) => console.log('error is', e));

    return () => {
      isSync = false;
    };
  }, [account, account?.genesisHash, _isAccountAll, genesisOptions]);

  return (<></>);
}

export default React.memo(Rendering);
