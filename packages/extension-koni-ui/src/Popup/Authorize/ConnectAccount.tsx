// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

import check from '@polkadot/extension-koni-ui/assets/check.svg';
import { AccountInfoEl } from '@polkadot/extension-koni-ui/components';
import { KeypairType } from '@polkadot/util-crypto/types';

interface Props extends ThemeProps {
  className?: string;
  address?: string | null;
  genesisHash?: string | null;
  name?: string | null;
  parentName?: string | null;
  type?: KeypairType;
  suri?: string;
  selectAccountCallBack?: () => void;
}

function ConnectAccount ({ address, className, genesisHash, name, parentName, selectAccountCallBack, suri, type }: Props): React.ReactElement<Props> {
  const [isSelected, setSelected] = useState(false);

  const selectAccounts = useCallback(() => {
    setSelected(!isSelected);
    selectAccountCallBack && selectAccountCallBack();
  }, [isSelected, selectAccountCallBack]);

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

  &:last-child {
    margin-bottom: 0;
  }
`);
