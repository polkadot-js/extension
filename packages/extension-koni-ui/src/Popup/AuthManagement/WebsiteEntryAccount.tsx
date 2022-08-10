// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import { AuthUrls } from '@subwallet/extension-base/background/handlers/State';
import { AccountInfoEl } from '@subwallet/extension-koni-ui/components';
import Toggle from '@subwallet/extension-koni-ui/components/Toggle';
import { changeAuthorizationPerAcc, saveCurrentAccountAddress } from '@subwallet/extension-koni-ui/messaging';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { noop } from '@subwallet/extension-koni-ui/util/function';
import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  address: string;
  isConnected: boolean;
  url: string;
  setList: (data: AuthUrls) => void;
}

function WebsiteEntryAccount ({ address, className = '', isConnected, setList, url }: Props): React.ReactElement<Props> {
  const { currentAccount } = useSelector((state: RootState) => state);

  const [isAccountConnected, setAccountConnected] = useState<boolean>(false);

  useEffect(() => {
    setAccountConnected(isConnected);
  }, [isConnected]);

  const onChangeToggleAcc = useCallback(() => {
    changeAuthorizationPerAcc(address, !isConnected, url, (data) => {
      setList(data);
      setAccountConnected(!isConnected);
    })
      .then(() => {
        if (currentAccount.account?.address) {
          saveCurrentAccountAddress({ address: currentAccount.account.address }, noop)
            .catch((e) => {
              console.error('There is a problem when trigger saveCurrentAccountAddress', e);
            });
        }
      })
      .catch(console.error);
  }, [address, currentAccount.account?.address, isConnected, setList, url]);

  return (
    <div className={className}>
      <AccountInfoEl
        address={address}
        iconSize={22}
        isShowAddress={false}
        isShowBanner={false}
        showCopyBtn={false}
      />
      <Toggle
        label={''}
        onChange={onChangeToggleAcc}
        value={isAccountConnected}
      />
    </div>
  );
}

export default styled(WebsiteEntryAccount)(({ theme }: Props) => `
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;

  & .account-info-row {
    height: 50px;
  }
`);
