// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { AuthorizeRequest, SigningRequest } from '@polkadot/extension/background/types';
import { KeyringJson } from '@polkadot/ui-keyring/types';

import React, { useEffect, useState } from 'react';
import { Route, Switch } from 'react-router';

import { Loading } from '../components';
import { AccountContext, ActionContext, AuthorizeContext, SigningContext } from '../components/contexts';
import { subscribeAccounts, subscribeAuthorize, subscribeSigning } from '../messaging';
import Accounts from './Accounts';
import Authorize from './Authorize';
import Create from './Create';
import Forget from './Forget';
import Import from './Import';
import Signing from './Signing';
import Welcome from './Welcome';


// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function Popup (props: {}): JSX.Element {
  const [accounts, setAccounts] = useState<null | Array<KeyringJson>>(null);
  const [authRequests, setAuthRequests] = useState<null | Array<AuthorizeRequest>>(null);
  const [signRequests, setSignRequests] = useState<null | Array<SigningRequest>>(null);
  const [isWelcomeDone, setWelcomeDone] = useState(false);

  const onAction = (to?: string): void => {
    setWelcomeDone(window.localStorage.getItem('welcome_read') === 'ok');

    if (to) {
      window.location.hash = to;
    }
  };

  useEffect((): void => {
    Promise.all([
      subscribeAccounts(setAccounts),
      subscribeAuthorize(setAuthRequests),
      subscribeSigning(setSignRequests)
    ]).catch(console.error);
    onAction();
  }, []);

  const Root = isWelcomeDone
    ? authRequests && authRequests.length
      ? Authorize
      : signRequests && signRequests.length
        ? Signing
        : Accounts
    : Welcome;

  return (
    <Loading>{accounts && authRequests && signRequests && (
      <ActionContext.Provider value={onAction}>
        <AccountContext.Provider value={accounts}>
          <AuthorizeContext.Provider value={authRequests}>
            <SigningContext.Provider value={signRequests}>
              <Switch>
                <Route path='/account/create' component={Create} />
                <Route path='/account/forget/:address' component={Forget} />
                <Route path='/account/import' component={Import} />
                <Route exact path='/' component={Root} />
              </Switch>
            </SigningContext.Provider>
          </AuthorizeContext.Provider>
        </AccountContext.Provider>
      </ActionContext.Provider>
    )}</Loading>
  );
}
