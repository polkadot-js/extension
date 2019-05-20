// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { MessageExtrinsicSign } from '@polkadot/extension/background/types';
import { KeyringJson } from '@polkadot/ui-keyring/types';

import React, { useEffect, useState } from 'react';
import { Route, Switch } from 'react-router';

import { Loading } from '../components';
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

  const onAction = (): void => {
    // loads all accounts & requests (this is passed through to children to trigger changes)
    Promise
      .all([getAccounts(), getRequests()])
      .then(([accounts, requests]) => {
        setAccounts(accounts);
        setRequests(requests);
      })
      .catch(console.error);
  };

  useEffect((): void => {
    // with an empty state, load the accounts & requests
    onAction();
  }, []);

  return (
    <Loading>{accounts && requests && (
      <Switch>
        <Route path='/account/create' component={() =>
          <Create onAction={onAction} />
        } />
        <Route path='/account/forget/:address' component={() =>
          <Forget accounts={accounts} onAction={onAction} />
        } />
        <Route path='/account/import' component={() =>
          <Import onAction={onAction} />
        } />
        <Route
          exact path='/' component={() =>
          requests.length
            ? <Signing accounts={accounts} onAction={onAction} requests={requests} />
            : <Accounts accounts={accounts} onAction={onAction} />
        } />
      </Switch>
    )}</Loading>
  );
}
