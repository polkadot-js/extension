// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { KeyringJson } from '@polkadot/ui-keyring/types';

import React from 'react';
import { RouteComponentProps, withRouter } from 'react-router';

import { Address, Button, Header, Tip } from '../components';
import { forgetAccount } from '../messaging';
import { Back } from '../partials';

type Props = RouteComponentProps<{ address: string }> & {
  accounts: Array<KeyringJson>,
  onAction: () => void
};

function Forget (props: Props) {
  const { accounts, match: { params: { address } }, onAction } = props;
  const account = accounts.find((account) => address === account.address);

  const _onClick = (): void => {
    forgetAccount(address)
      .then(onAction)
      .catch(console.error);
  };

  return (
    <div>
      <Header label='forget account' />
      <Back />
      <Tip header='danger' type='error'>You are about to remove the account. This means that you will not be able to access it via this extension anymore. If you wish to recover it, you would need to use the seed.</Tip>
      <Address
        address={address}
        name={account && account.meta.name}
      />
      <Button
        isFull
        label='I want to forget this account'
        onClick={_onClick}
      />
    </div>
  );
}

export default withRouter(Forget);
