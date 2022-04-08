// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

import { AuthUrls } from '@polkadot/extension-base/background/handlers/State';
import { AccountInfoEl } from '@polkadot/extension-koni-ui/components';
import Toggle from '@polkadot/extension-koni-ui/components/Toggle';
import { changeAuthorizationPerAcc } from '@polkadot/extension-koni-ui/messaging';

interface Props extends ThemeProps {
  className?: string;
  address: string;
  isConnected: boolean;
  url: string;
  setList: (data: AuthUrls) => void;
}

function WebsiteEntryAccount ({ address, className = '', isConnected, setList, url }: Props): React.ReactElement<Props> {
  const [isAccountConnected, setAccountConnected] = useState<boolean>(false);

  useEffect(() => {
    setAccountConnected(isConnected);
  }, [isConnected]);

  const onChangeToggleAcc = useCallback(() => {
    changeAuthorizationPerAcc(address, !isConnected, url, (data) => {
      setList(data);
      setAccountConnected(!isConnected);
    }).catch(console.error);
  }, [address, isConnected, setList, url]);

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
