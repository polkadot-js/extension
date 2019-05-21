// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import { RouteComponentProps, withRouter } from 'react-router';

import { Address, Button, Header, Tip } from '../components';
import { forgetAccount } from '../messaging';
import { Back } from '../partials';
import { ActionContext } from '../components/contexts';

type Props = RouteComponentProps<{ address: string }> & {};

function Forget (props: Props) {
  const { match: { params: { address } } } = props;

  return (
    <ActionContext.Consumer>
      {(onAction) => {
        const onClick = (): void => {
          forgetAccount(address)
            .then(() => onAction('/'))
            .catch(console.error);
        };

        return (
          <div>
            <Header label='forget account' />
            <Back />
            <Address address={address} />
            <Tip header='danger' type='error'>You are about to remove the account. This means that you will not be able to access it via this extension anymore. If you wish to recover it, you would need to use the seed.</Tip>
            <Button
              isDanger
              label='I want to forget this account'
              onClick={onClick}
            />
          </div>
        );
      }}
    </ActionContext.Consumer>
  );
}

export default withRouter(Forget);
