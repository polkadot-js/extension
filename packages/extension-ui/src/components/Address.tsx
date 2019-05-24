// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { AccountsFromCtx } from './types';

import React from 'react';
import styled from 'styled-components';
import Identicon from '@polkadot/ui-identicon';

import Box from './Box';
import { withAccounts } from './contexts';
import defaults from './defaults';

type Props = {
  accounts: AccountsFromCtx,
  address?: string | null,
  children?: React.ReactNode;
  className?: string,
  isHidden?: boolean,
  name?: React.ReactNode | null,
  theme?: 'polkadot' | 'substrate'
};

function Address ({ accounts, address, children, className, isHidden, name, theme = 'polkadot' }: Props) {
  if (isHidden) {
    return null;
  }

  const account = accounts.find((account) => account.address === address);

  return (
    <div className={className}>
      <Box className='details'>
        <div className='name'>{name || (account && account.meta.name) || '<unknown>'}</div>
        <div className='address'>{address || '<unknown>'}</div>
        <div className='children'>{children}</div>
      </Box>
      <Identicon
        className='icon'
        size={64}
        theme={theme}
        value={address}
      />
    </div>
  );
}

export default withAccounts(styled(Address)`
  box-sizing: border-box;
  margin: ${defaults.boxMargin};
  padding: ${defaults.boxPadding};
  padding-left: 1rem;
  position: relative;

  .details {
    margin: 0;

    .address,
    .name {
      padding-left: 3rem;
    }

    .address {
      opacity: 0.5;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .name {
      padding-bottom: 0.5rem;
    }
  }

  .icon {
    left: 0.25rem;
    position: absolute;
    top: -0.5rem;
    z-index: 1;
  }
`);
