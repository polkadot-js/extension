// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { MessageExtrinsicSign } from '@polkadot/extension/background/types';
import { KeyringJson } from '@polkadot/ui-keyring/types';

import React, { useEffect, useState } from 'react';
import { Route, Switch } from 'react-router';

import { Loading } from '../components';
import { AccountContext, ActionContext, SigningContext } from '../components/contexts';
import { getAccounts, getRequests } from '../messaging';
import Accounts from './Accounts';
import Create from './Create';
import Forget from './Forget';
import Import from './Import';
import Signing from './Signing';

type Props = {};

export default function Popup (props: Props) {
  const [accounts, setAccounts] = useState(null as null | Array<KeyringJson>);
  const [requests, setRequests] = useState(null as null | Array<[number, MessageExtrinsicSign, string]>);

  const onAction = (to?: string): void => {
    // loads all accounts & requests (this is passed through to children to trigger changes)
    Promise
      .all([getAccounts(), getRequests()])
      .then(([accounts, requests]) => {
        setAccounts(accounts);
        setRequests(requests);
      })
      .catch(console.error);

    if (to) {
      window.location.hash = to;
    }
  };

  useEffect((): void => {
    // with an empty state, load the accounts & requests
    onAction();
  }, []);

  return (
    <Loading>{accounts && requests && (
      <ActionContext.Provider value={onAction}>
        <AccountContext.Provider value={accounts}>
          <SigningContext.Provider value={requests}>
            <Switch>
              <Route path='/account/create' component={Create} />
              <Route path='/account/forget/:address' component={Forget} />
              <Route path='/account/import' component={Import} />
              <Route exact path='/' component={requests.length ? Signing : Accounts} />
            </Switch>
          </SigningContext.Provider>
        </AccountContext.Provider>
      </ActionContext.Provider>
    )}</Loading>
  );
}
