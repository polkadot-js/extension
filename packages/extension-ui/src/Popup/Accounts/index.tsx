// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useContext } from 'react';

import { AccountContext, Button, Header, Link, MediaContext, Tip } from '../../components';
import Account from './Account';

type Props = {};

export default function Accounts (): React.ReactElement<Props> {
  const accounts = useContext(AccountContext);
  const mediaAllowed = useContext(MediaContext);

  return (
    <div>
      <Header
        label='accounts'
        labelExtra={<Link to='/settings'>Options</Link>}
      />
      {
        (accounts.length === 0)
          ? <Tip header='add accounts' type='warn'>You currently don&apos;t have any accounts. Either create a new account or if you have an existing account you wish to use, import it with the seed phrase</Tip>
          : accounts.map((json, index): React.ReactNode => (
            <Account
              {...json}
              key={`${index}:${json.address}`}
            />
          ))
      }
      <Button
        label='I want to create a new account with a new seed'
        to='/account/create'
      />
      <Button
        label='I have a pre-existing seed, import the account'
        to='/account/import-seed'
      />
      {mediaAllowed && (
        <Button
          label='I have an external account, add it via QR'
          to='/account/import-qr'
        />
      )}
    </div>
  );
}
