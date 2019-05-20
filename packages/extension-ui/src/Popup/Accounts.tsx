// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { KeyringJson } from '@polkadot/ui-keyring/types';

import React from 'react';

import { Address, Button, Header, Tip } from '../components';

type Props = {
  accounts: Array<KeyringJson>
};

export default function Accounts ({ accounts }: Props) {
  return (
    <div>
      <Header label='accounts' />
      {
        (accounts.length === 0)
          ? <Tip header='add accounts' type='warn'>You currently don't have any accounts. Either create a new account or if you have an existing account you wish to use, import it with the seed phrase</Tip>
          : accounts.map(({ address, meta: { name } }) => (
            <Address
              address={address}
              key={address}
              name={name}
            />
          ))
      }
      <Button
        isFull
        label='I want to create a new account with a new seed'
        to='/account/create'
      />
      <Button
        isFull
        label='I have a pre-existing seed, import the account'
        to='/account/import'
      />
    </div>
  );
}
