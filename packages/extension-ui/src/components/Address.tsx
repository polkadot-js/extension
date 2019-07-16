// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { KeyringJson } from '@polkadot/ui-keyring/types';
import { AccountsFromCtx } from './types';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Identicon from '@polkadot/ui-identicon';

import IconBox from './IconBox';
import { withAccounts } from './contexts';
import { decodeAddress } from '@polkadot/util-crypto';

interface Props {
  accounts: AccountsFromCtx;
  address?: string | null;
  children?: React.ReactNode;
  className?: string;
  name?: React.ReactNode | null;
  theme?: 'polkadot' | 'substrate';
}

function Address ({ accounts, address, children, className, name, theme = 'polkadot' }: Props): React.ReactElement<Props> {
  const [account, setAccount] = useState<KeyringJson | null>(null);

  useEffect((): void => {
    const addrU8a = decodeAddress(address || '').toString();

    setAccount(
      accounts.find((account): boolean =>
        decodeAddress(account.address).toString() === addrU8a
      ) || null
    );
  }, [address]);

  return (
    <IconBox
      className={className}
      icon={
        <Identicon
          className='icon'
          size={64}
          theme={theme}
          value={address}
        />
      }
      intro={
        <>
          <div className='name'>{name || (account && account.meta.name) || '<unknown>'}</div>
          <div className='address'>{address || '<unknown>'}</div>
        </>
      }
    >
      {children}
    </IconBox>
  );
}

export default withAccounts(styled(Address)`
  .address {
    opacity: 0.5;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .name {
    padding-bottom: 0.5rem;
  }
`);
