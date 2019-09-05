// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useContext } from 'react';

import { AccountContext, Button, Header, Link, Tip } from '../../components';
import Account from './Account';

export default function Accounts (): React.ReactElement<{}> {
  const accounts = useContext(AccountContext);

  return (
    <div>
      <Header
        label='accounts'
        labelExtra={<Link to='/settings'>Settings</Link>}
      />
      {
        (accounts.length === 0)
          ? <Tip header='add accounts' type='warn'>You currently don&apos;t have any accounts. Either create a new account or if you have an existing account you wish to use, import it with the seed phrase</Tip>
          : accounts.map(({ address }): React.ReactNode => (
            <Account
              address={address}
              key={address}
            />
          ))
      }
      <Button
        label='I want to create a new account with a new seed'
        to='/account/create'
      />
      <Button
        label='I have a pre-existing seed, import the account'
        to='/account/import'
      />
    </div>
  );
}
