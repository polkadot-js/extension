/* eslint-disable react-hooks/exhaustive-deps */
// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line header/header
import type { ThemeProps } from '../../types';

import check from '@subwallet/extension-koni-ui/assets/check.svg';
import { AccountInfoEl } from '@subwallet/extension-koni-ui/components';
import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

import { KeypairType } from '@polkadot/util-crypto/types';

interface Props extends ThemeProps {
  className?: string;
  address: string;
  genesisHash?: string | null;
  name?: string | null;
  parentName?: string | null;
  type?: KeypairType;
  suri?: string;
  selectedAccounts: string[];
  selectAccountCallBack?: (selectedAccounts: string[]) => void;
}

function ConnectAccount ({ address, className, genesisHash, name, parentName, selectAccountCallBack, selectedAccounts, suri, type }: Props): React.ReactElement<Props> {
  const [isSelected, setSelected] = useState(selectedAccounts.includes(address));
  const deps = selectedAccounts.toString();

  const selectAccounts = useCallback(() => {
    if (isSelected) {
      selectAccountCallBack && selectAccountCallBack(selectedAccounts.filter((acc) => acc !== address));
    } else {
      selectAccountCallBack && selectAccountCallBack(selectedAccounts.concat(address));
    }

    setSelected(!isSelected);
  }, [address, isSelected, selectAccountCallBack, deps]);

  return (
    <div
      className={className}
      onClick={selectAccounts}
    >
      <AccountInfoEl
        address={address}
        className='authorize-request__account'
        genesisHash={genesisHash}
        isShowAddress={false}
        isShowBanner={false}
        name={name}
        parentName={parentName}
        showCopyBtn={false}
        suri={suri}
        type={type}
      />
      {isSelected
        ? (
          <img
            alt='check'
            src={check}
          />
        )
        : (
          <div className='account-unchecked-item' />
        )
      }
    </div>
  );
}

export default styled(ConnectAccount)(({ theme }: Props) => `
  border-radius: 8px;
  padding: 8px 10px;
  background-color: ${theme.accountAuthorizeRequest};
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  cursor: pointer;

  &:last-child {
    margin-bottom: 0;
  }
`);
